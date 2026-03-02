
-- Create storage bucket for listing images
INSERT INTO storage.buckets (id, name, public) VALUES ('listing-images', 'listing-images', true);

-- Storage policies for listing images
CREATE POLICY "Anyone can view listing images" ON storage.objects FOR SELECT USING (bucket_id = 'listing-images');
CREATE POLICY "Authenticated users can upload listing images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'listing-images');
CREATE POLICY "Users can delete own listing images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'listing-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Listings table
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL DEFAULT '',
  content_language TEXT NOT NULL DEFAULT 'English',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active listings" ON public.listings FOR SELECT USING (status = 'active' OR auth.uid() = user_id);
CREATE POLICY "Users can insert own listing" ON public.listings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own listing" ON public.listings FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own listing" ON public.listings FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER set_listings_updated_at BEFORE UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Social media accounts linked to a listing
CREATE TABLE public.listing_social_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  username TEXT NOT NULL
);

ALTER TABLE public.listing_social_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read listing social media" ON public.listing_social_media FOR SELECT USING (true);
CREATE POLICY "Listing owners can insert" ON public.listing_social_media FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.listings WHERE id = listing_id AND user_id = auth.uid())
);
CREATE POLICY "Listing owners can update" ON public.listing_social_media FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.listings WHERE id = listing_id AND user_id = auth.uid())
);
CREATE POLICY "Listing owners can delete" ON public.listing_social_media FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.listings WHERE id = listing_id AND user_id = auth.uid())
);

-- Pricing per platform + content type
CREATE TABLE public.listing_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  content_type TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0
);

ALTER TABLE public.listing_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read listing prices" ON public.listing_prices FOR SELECT USING (true);
CREATE POLICY "Listing owners can insert prices" ON public.listing_prices FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.listings WHERE id = listing_id AND user_id = auth.uid())
);
CREATE POLICY "Listing owners can update prices" ON public.listing_prices FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.listings WHERE id = listing_id AND user_id = auth.uid())
);
CREATE POLICY "Listing owners can delete prices" ON public.listing_prices FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.listings WHERE id = listing_id AND user_id = auth.uid())
);

-- Images for a listing
CREATE TABLE public.listing_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0
);

ALTER TABLE public.listing_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read listing images table" ON public.listing_images FOR SELECT USING (true);
CREATE POLICY "Listing owners can insert images" ON public.listing_images FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.listings WHERE id = listing_id AND user_id = auth.uid())
);
CREATE POLICY "Listing owners can delete images" ON public.listing_images FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.listings WHERE id = listing_id AND user_id = auth.uid())
);
