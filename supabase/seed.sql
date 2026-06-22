-- Run after schema.sql in Supabase SQL Editor

insert into categories (name, slug, description, sort_order) values
  ('Sarees', 'sarees', 'Elegant ready-to-wear and traditional sarees', 1),
  ('T-Shirts', 't-shirts', 'Trendy graphic and plain tees for every style', 2),
  ('Jeans & Bottoms', 'jeans', 'Cargo denim, joggers, and utility pants', 3),
  ('Ethnic Wear', 'ethnic-wear', 'Jodhpuri sets and kurta collections', 4)
on conflict (slug) do nothing;

insert into products (category_id, name, slug, description, price, compare_at_price, image_url, badge, is_new_arrival, is_featured, is_popular) values
  ((select id from categories where slug = 'sarees'), 'Magnetic Mint Ready-to-Wear Saree', 'magnetic-mint-ready-to-wear-saree', 'Effortless drape with a magnetic mint finish for modern occasions.', 7500, 15000, 'https://images.unsplash.com/photo-1610030458921-c7ad1b99dd94?w=800&q=80', '-50%', true, false, false),
  ((select id from categories where slug = 'sarees'), 'Sassy Saffron Ready-to-Wear Saree', 'sassy-saffron-ready-to-wear-saree', 'Bold saffron tones with a contemporary ready-to-wear silhouette.', 7500, 15000, 'https://images.unsplash.com/photo-1583391734526-7cdb30ee5ff5?w=800&q=80', '-50%', true, false, false),
  ((select id from categories where slug = 'sarees'), 'Offshore Ocean Ready-to-Wear Saree', 'offshore-ocean-ready-to-wear-saree', 'Ocean-inspired hues with fluid, graceful draping.', 8000, 12000, 'https://images.unsplash.com/photo-1617627143750-d86bc21e3511?w=800&q=80', '-33%', true, true, false),
  ((select id from categories where slug = 'sarees'), 'The Queen''s Lustrous Lime Saree', 'the-queens-lustrous-lime-saree', 'A luminous lime saree crafted for statement evenings.', 5000, 9800, 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80', '-49%', true, false, false),
  ((select id from categories where slug = 'sarees'), 'Noor-e-Hara Saree', 'noor-e-hara-saree', 'Fresh green elegance with refined festive detailing.', 4000, 5600, 'https://images.unsplash.com/photo-1564557287817-3785e38c1b45?w=800&q=80', '-29%', false, false, true),
  ((select id from categories where slug = 'sarees'), 'Ruby Martini Cocktail Saree', 'ruby-martini-cocktail-saree', 'Cocktail-ready glamour in rich ruby tones.', 4000, 6500, 'https://images.unsplash.com/photo-1583391734526-7cdb30ee5ff5?w=800&q=80', '-38%', false, false, true),
  ((select id from categories where slug = 't-shirts'), 'Men''s White Pop Hope Typography T-shirt', 'mens-white-pop-hope-typography-tshirt', 'Clean white tee with bold hope typography.', 799, null, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80', null, false, true, false),
  ((select id from categories where slug = 't-shirts'), 'Men''s Black Vagabond Graphic Printed T-shirt', 'mens-black-vagabond-graphic-tshirt', 'Street-ready black graphic tee with attitude.', 499, null, 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800&q=80', null, false, false, false),
  ((select id from categories where slug = 't-shirts'), 'Urban Mini Printed T-Shirt', 'urban-mini-printed-tshirt', 'Compact urban print for everyday casual wear.', 999, null, 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80', null, false, true, false),
  ((select id from categories where slug = 't-shirts'), 'OtakuStorm Multi-Character Anime', 'otakustorm-multi-character-anime', 'Anime-inspired oversized tee for otaku culture fans.', 899, null, 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&q=80', null, false, false, true),
  ((select id from categories where slug = 'jeans'), 'Urban Rover Shadow Cargo Denim Jeans', 'urban-rover-shadow-cargo-denim-jeans', 'Shadow-wash cargo denim with utility pockets.', 2199, null, 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80', null, false, true, false),
  ((select id from categories where slug = 'jeans'), 'Midnight Utility Black Cargo Denim Jeans', 'midnight-utility-black-cargo-denim-jeans', 'All-black cargo denim built for urban exploration.', 1799, null, 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80', null, false, true, false),
  ((select id from categories where slug = 'jeans'), 'Olive Utility Cargo Pants', 'olive-utility-cargo-pants', 'Relaxed olive cargo pants with durable stitching.', 1099, null, 'https://images.unsplash.com/photo-1473966960800-7dee2ee2e7b0?w=800&q=80', null, false, false, true),
  ((select id from categories where slug = 'ethnic-wear'), 'Satya Light Pink Jodhpuri Set', 'satya-light-pink-jodhpuri-set', 'Light pink jodhpuri set with short kurta and trouser.', 17260, null, 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&q=80', null, false, true, false),
  ((select id from categories where slug = 'ethnic-wear'), 'Shaurya Multi Jodhpuri Set', 'shaurya-multi-jodhpuri-set', 'Embroidered multi-tone jodhpuri set for festive occasions.', 15999, null, 'https://images.unsplash.com/photo-1596755094514-f87e34085b56?w=800&q=80', null, false, true, false)
on conflict (slug) do nothing;
