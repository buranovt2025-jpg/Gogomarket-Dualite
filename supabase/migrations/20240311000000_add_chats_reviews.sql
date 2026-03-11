/*
  # Create Chats and Reviews tables
  This migration adds tables for real-time messaging and product reviews.

  ## Query Description:
  Creates `reviews` and `messages` tables with appropriate foreign keys to `profiles` and `products`.
  Enables RLS and sets up policies for secure access.
  
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
  
  ## Structure Details:
  - New table `reviews` (product_id, user_id, rating, text)
  - New table `messages` (sender_id, receiver_id, text, is_read)
  
  ## Security Implications:
  - RLS Status: Enabled
  - Policy Changes: Added policies for reading/writing reviews and messages
  - Auth Requirements: Must be authenticated to insert
  
  ## Performance Impact:
  - Indexes: None explicitly added beyond PKs
  - Triggers: None
  - Estimated Impact: Negligible
*/

-- Таблица отзывов
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Отзывы видны всем" 
    ON public.reviews FOR SELECT 
    USING (true);

CREATE POLICY "Авторизованные могут оставлять отзывы" 
    ON public.reviews FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Таблица сообщений (Чаты)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Пользователи видят свои сообщения" 
    ON public.messages FOR SELECT 
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Пользователи могут отправлять сообщения" 
    ON public.messages FOR INSERT 
    WITH CHECK (auth.uid() = sender_id);
