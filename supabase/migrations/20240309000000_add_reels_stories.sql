/*
  # Add Reels, Stories and Fix Profile Policies

  ## Query Description:
  Эта миграция исправляет ошибку с невозможностью стать продавцом, добавляя политику INSERT для таблицы profiles. 
  Также она создает полноценные таблицы для хранения Рилсов (reels) и Историй (stories), чтобы пользователи могли их публиковать.
  
  ## Metadata:
  - Schema-Category: Structural
  - Impact-Level: Medium
  - Requires-Backup: false
  - Reversible: true
  
  ## Structure Details:
  - Добавлена политика INSERT для `profiles`
  - Создана таблица `reels` с привязкой к продавцу и товару
  - Создана таблица `stories` с привязкой к продавцу и автоудалением (expires_at)
  
  ## Security Implications:
  - RLS Status: Enabled для новых таблиц
  - Policy Changes: Yes (добавлены политики чтения/записи)
*/

-- 1. Исправление: Разрешаем пользователям создавать свой профиль, если триггер не сработал
CREATE POLICY "Пользователи могут создавать свой профиль" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 2. Создание таблицы для Рилсов
CREATE TABLE IF NOT EXISTS public.reels (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    video_url text NOT NULL,
    description text,
    product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
    likes_count integer DEFAULT 0,
    comments_count integer DEFAULT 0,
    shares_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Рилсы видны всем" ON public.reels FOR SELECT USING (true);
CREATE POLICY "Продавцы могут создавать рилсы" ON public.reels FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Продавцы могут удалять свои рилсы" ON public.reels FOR DELETE USING (auth.uid() = seller_id);

-- 3. Создание таблицы для Историй
CREATE TABLE IF NOT EXISTS public.stories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    image_url text NOT NULL,
    title text,
    product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Активные истории видны всем" ON public.stories FOR SELECT USING (expires_at > now());
CREATE POLICY "Продавцы могут создавать истории" ON public.stories FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Продавцы могут удалять свои истории" ON public.stories FOR DELETE USING (auth.uid() = seller_id);
