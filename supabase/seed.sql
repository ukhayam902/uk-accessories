-- UK Accessories — DEMO seed (sample prices, NOT verified market prices)
-- Run after 001_init.sql. All products are marked is_demo = true.
-- Images are original representative SVG illustrations shipped with the app
-- (public/images/*.svg) — replace with real shop photos in Supabase Storage
-- before presenting products as real stock. No fake reviews are seeded.

insert into public.categories (id, name, slug, description) values
('cases','Phone Cases and Covers','phone-cases-and-covers','Protective, premium cases.'),
('earbuds','Wireless Earbuds','wireless-earbuds','True wireless sound, on the go.'),
('headphones','Headphones','headphones','Over-ear and on-ear listening.'),
('chargers','Fast Chargers','fast-chargers','Fast, safe charging at home and on the road.'),
('cables','Charging Cables','charging-cables','Durable USB-C and braided cables.'),
('powerbanks','Power Banks','power-banks','Portable power for long days.'),
('smartwatches','Smartwatches','smartwatches','Fitness and everyday smartwatches.'),
('protectors','Screen Protectors','screen-protectors','Tempered glass protection.'),
('holders','Phone Holders and Stands','phone-holders-and-stands','Desk, car and everyday holders.'),
('speakers','Bluetooth Speakers','bluetooth-speakers','Portable speakers with clear sound.'),
('gaming','Gaming Accessories','gaming-accessories','Gear for mobile gaming.'),
('gadgets','Other Tech Gadgets','other-tech-gadgets','Useful everyday tech.')
on conflict (id) do nothing;

insert into public.products (id, sku, slug, name, category_id, price, stock, description, image_url, colours, featured, bestseller, trending, is_new, is_demo, seo_title, seo_description) values
('p1','UK-EB-001','premium-wireless-earbuds','Premium Wireless Earbuds','earbuds',2499,42,'Demo sample: compact true wireless earbuds with a charging case.','/images/earbuds-photo.webp',array['Black','White'],true,true,true,false,true,'Premium Wireless Earbuds — UK Accessories','Demo product — price to be confirmed by the shop owner.'),
('p2','UK-CH-002','magnetic-fast-wireless-charger','Magnetic Fast Wireless Charger','chargers',2199,30,'Demo sample: magnetic wireless charging pad for compatible phones.','/images/charger-photo.webp',array['Black','White'],true,false,false,false,true,'Magnetic Fast Wireless Charger — UK Accessories','Demo product — price to be confirmed by the shop owner.'),
('p3','UK-PB-003','20000mah-power-bank','20,000mAh Power Bank','powerbanks',3999,25,'Demo sample: high-capacity portable power.','/images/powerbank-20k-photo.webp',array['Black'],true,true,false,false,true,'20,000mAh Power Bank — UK Accessories','Demo product — price to be confirmed by the shop owner.'),
('p4','UK-CS-004','premium-silicone-phone-case','Premium Silicone Phone Case','cases',899,120,'Demo sample: soft-touch silicone case with raised edges.','/images/case-photo.webp',array['Black','White','Silver'],false,true,false,true,true,'Premium Silicone Phone Case — UK Accessories','Demo product — price to be confirmed by the shop owner.'),
('p5','UK-CB-005','usb-c-fast-charging-cable','USB-C Fast Charging Cable','cables',499,200,'Demo sample: everyday USB-C cable for charging and data.','/images/cable-usbc.svg',array['Black','White'],false,false,false,false,true,'USB-C Fast Charging Cable — UK Accessories','Demo product — price to be confirmed by the shop owner.'),
('p6','UK-SW-006','smart-fitness-watch','Smart Fitness Watch','smartwatches',4499,18,'Demo sample: fitness watch with step and notification features.','/images/watch.svg',array['Black','Silver'],true,false,true,true,true,'Smart Fitness Watch — UK Accessories','Demo product — price to be confirmed by the shop owner.'),
('p7','UK-HP-007','wireless-bluetooth-headphones','Wireless Bluetooth Headphones','headphones',3499,22,'Demo sample: comfortable over-ear Bluetooth headphones.','/images/headphones.svg',array['Black'],false,true,false,false,true,'Wireless Bluetooth Headphones — UK Accessories','Demo product — price to be confirmed by the shop owner.'),
('p8','UK-SP-008','tempered-glass-screen-protector','Tempered Glass Screen Protector','protectors',399,300,'Demo sample: tempered glass protector. Model compatibility must be confirmed at order time.','/images/glass.svg',array['Clear'],false,false,false,false,true,'Tempered Glass Screen Protector — UK Accessories','Demo product — price to be confirmed by the shop owner.'),
('p9','UK-BS-009','portable-bluetooth-speaker','Portable Bluetooth Speaker','speakers',2999,28,'Demo sample: portable speaker with clear sound.','/images/speaker.svg',array['Black','Silver'],false,false,true,false,true,'Portable Bluetooth Speaker — UK Accessories','Demo product — price to be confirmed by the shop owner.'),
('p10','UK-ST-010','adjustable-mobile-phone-stand','Adjustable Mobile Phone Stand','holders',799,65,'Demo sample: adjustable desk stand for hands-free use.','/images/stand.svg',array['Black','Silver'],false,false,false,false,true,'Adjustable Mobile Phone Stand — UK Accessories','Demo product — price to be confirmed by the shop owner.'),
('p11','UK-CH-011','65w-fast-charging-adapter','65W Fast Charging Adapter','chargers',2499,35,'Demo sample: compact 65W adapter.','/images/adapter-65w.svg',array['Black','White'],true,false,false,false,true,'65W Fast Charging Adapter — UK Accessories','Demo product — price to be confirmed by the shop owner.'),
('p12','UK-GM-012','gaming-finger-sleeves','Gaming Finger Sleeves','gaming',399,150,'Demo sample: breathable finger sleeves for mobile gaming.','/images/sleeves.svg',array['Black'],false,false,false,false,true,'Gaming Finger Sleeves — UK Accessories','Demo product — price to be confirmed by the shop owner.'),
('p13','UK-HL-013','magnetic-car-phone-holder','Magnetic Car Phone Holder','holders',1199,48,'Demo sample: magnetic car holder for hands-free navigation.','/images/car-holder.svg',array['Black'],false,false,false,true,true,'Magnetic Car Phone Holder — UK Accessories','Demo product — price to be confirmed by the shop owner.'),
('p14','UK-CB-014','premium-braided-charging-cable','Premium Braided Charging Cable','cables',699,140,'Demo sample: braided cable built to resist tangles.','/images/cable-braided.svg',array['Black','Silver'],false,true,false,false,true,'Premium Braided Charging Cable — UK Accessories','Demo product — price to be confirmed by the shop owner.'),
('p15','UK-PB-015','mini-portable-power-bank','Mini Portable Power Bank','powerbanks',1999,40,'Demo sample: pocket-sized power bank.','/images/powerbank-mini.svg',array['Black','White'],false,false,true,true,true,'Mini Portable Power Bank — UK Accessories','Demo product — price to be confirmed by the shop owner.')
on conflict (id) do nothing;

insert into public.store_settings (id, store_name, slogan, whatsapp, currency) values
(1,'UK Accessories','Upgrade Your Tech. Elevate Your Style.','+92 3170851250','PKR')
on conflict (id) do nothing;

insert into public.shipping_methods (id, name, price, free_over, zone, estimate_days) values
('cod-pk','Cash on Delivery — Pakistan',250,5000,'Pakistan','To be confirmed by owner')
on conflict (id) do nothing;

insert into public.coupons (code, discount_type, discount_value, active) values
('UK10','percent',10,true) on conflict (code) do nothing;
