/*
  # Создание таблицы заказов (orders)
  
  ## Query Description:
  Создает таблицу для хранения заказов. Заказы связывают покупателя (buyer_id) и продавца (seller_id).
  Список товаров сохраняется в формате JSONB, чтобы зафиксировать цены и количество на момент покупки.
  
  ## Security Implications:
  - RLS Status: Enabled
  - Покупатели могут создавать заказы и видеть только свои покупки.
  - Продавцы могут видеть заказы, оформленные на их товары, и менять их статус.
*/

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    buyer_id uuid REFERENCES public.profiles(id) NOT NULL,
    seller_id uuid REFERENCES public.profiles(id) NOT NULL,
    items jsonb NOT NULL,
    total_amount numeric NOT NULL,
    status text DEFAULT 'Новый'::text,
    created_at timestamp with time zone DEFAULT now()
);

-- Включаем RLS (Row Level Security)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Политика: Покупатели могут видеть свои заказы
CREATE POLICY "Покупатели могут видеть свои заказы"
    ON public.orders FOR SELECT
    USING (auth.uid() = buyer_id);

-- Политика: Продавцы могут видеть заказы своих товаров
CREATE POLICY "Продавцы могут видеть заказы своих товаров"
    ON public.orders FOR SELECT
    USING (auth.uid() = seller_id);

-- Политика: Покупатели могут создавать заказы
CREATE POLICY "Покупатели могут создавать заказы"
    ON public.orders FOR INSERT
    WITH CHECK (auth.uid() = buyer_id);

-- Политика: Продавцы могут обновлять статус заказов
CREATE POLICY "Продавцы могут обновлять статус заказов"
    ON public.orders FOR UPDATE
    USING (auth.uid() = seller_id);
