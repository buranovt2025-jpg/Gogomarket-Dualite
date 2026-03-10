/*
# Initial Schema for GogoMarket MVP

## Query Description:
Создание базовой структуры базы данных для GogoMarket. 
Включает создание ENUM для уровней пользователей (tier), таблицу профилей (связанную с auth.users) и базовую таблицу товаров для реализации лимитов 2-го уровня.
Также настраивается триггер для автоматического создания профиля при регистрации.

## Metadata:
- Schema-Category: Structural
- Impact-Level: High
- Requires-Backup: false
- Reversible: true

## Structure Details:
- ENUM user_tier ('buyer', 'private_seller', 'business')
- Table public.profiles
- Table public.products
- Trigger on_auth_user_created

## Security Implications:
- RLS Status: Enabled on all public tables
- Policy Changes: Yes (basic CRUD policies)
- Auth Requirements: Required for modifications
*/

-- 1. Создание типа для уровней пользователей
CREATE TYPE user_tier AS ENUM ('buyer', 'private_seller', 'business');

-- 2. Создание таблицы профилей
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    phone TEXT UNIQUE,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    tier user_tier DEFAULT 'buyer'::user_tier,
    inn TEXT, -- Для бизнес-уровня
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Создание базовой таблицы товаров (объявлений)
CREATE TABLE public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(12, 2) NOT NULL,
    category TEXT NOT NULL,
    images TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'active', -- active, expired, pending_moderation
    expires_at TIMESTAMPTZ, -- Для автоудаления через 7 дней (Уровень 2)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Включение RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 5. Политики безопасности для Profiles
CREATE POLICY "Публичные профили видны всем" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Пользователи могут обновлять свой профиль" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 6. Политики безопасности для Products
CREATE POLICY "Активные товары видны всем" 
ON public.products FOR SELECT USING (status = 'active');

CREATE POLICY "Продавцы могут создавать товары" 
ON public.products FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Продавцы могут управлять своими товарами" 
ON public.products FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "Продавцы могут удалять свои товары" 
ON public.products FOR DELETE USING (auth.uid() = seller_id);

-- 7. Функция и триггер для автоматического создания профиля
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, phone, first_name, last_name)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'phone', 
    new.raw_user_meta_data->>'first_name', 
    new.raw_user_meta_data->>'last_name'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
