-- Seed subcategories for all 18 main categories
-- Each category gets specific service subcategories

-- Helper: we reference categories by their slug (unique) to insert subcategories

-- 1. Hotels
INSERT INTO subcategories (category_id, name, slug, icon, sort_order)
SELECT c.id, 'فنادق', 'hotels-5star', 'Hotel', 1 FROM categories c WHERE c.slug = 'hotels'
UNION ALL SELECT c.id, 'شقق مفروشة', 'hotels-apartments', 'Building', 2 FROM categories c WHERE c.slug = 'hotels'
UNION ALL SELECT c.id, 'منتجعات', 'hotels-resorts', 'Palmtree', 3 FROM categories c WHERE c.slug = 'hotels'
UNION ALL SELECT c.id, 'بيوت ضيافة', 'hotels-guesthouses', 'Home', 4 FROM categories c WHERE c.slug = 'hotels'
UNION ALL SELECT c.id, 'مبيت وإفطار', 'hotels-bnb', 'Coffee', 5 FROM categories c WHERE c.slug = 'hotels';

-- 2. Restaurants
INSERT INTO subcategories (category_id, name, slug, icon, sort_order)
SELECT c.id, 'مطاعم محلية', 'restaurants-local', 'Utensils', 1 FROM categories c WHERE c.slug = 'restaurants'
UNION ALL SELECT c.id, 'مطاعم وجبات سريعة', 'restaurants-fastfood', 'Sandwich', 2 FROM categories c WHERE c.slug = 'restaurants'
UNION ALL SELECT c.id, 'كافيهات ومقاهي', 'restaurants-cafe', 'Coffee', 3 FROM categories c WHERE c.slug = 'restaurants'
UNION ALL SELECT c.id, 'حلويات ومخبوزات', 'restaurants-sweets', 'Cake', 4 FROM categories c WHERE c.slug = 'restaurants'
UNION ALL SELECT c.id, 'توصيل طعام', 'restaurants-delivery', 'Bike', 5 FROM categories c WHERE c.slug = 'restaurants';

-- 3. Travel
INSERT INTO subcategories (category_id, name, slug, icon, sort_order)
SELECT c.id, 'وكالات سفر وسياحة', 'travel-agencies', 'Plane', 1 FROM categories c WHERE c.slug = 'travel'
UNION ALL SELECT c.id, 'حجز تذاكر طيران', 'travel-tickets', 'Ticket', 2 FROM categories c WHERE c.slug = 'travel'
UNION ALL SELECT c.id, 'جولات سياحية', 'travel-tours', 'Map', 3 FROM categories c WHERE c.slug = 'travel'
UNION ALL SELECT c.id, 'تأشيرات وفيزا', 'travel-visa', 'FileCheck', 4 FROM categories c WHERE c.slug = 'travel'
UNION ALL SELECT c.id, 'نقل من وإلى المطار', 'travel-airport', 'Luggage', 5 FROM categories c WHERE c.slug = 'travel';

-- 4. Marketing
INSERT INTO subcategories (category_id, name, slug, icon, sort_order)
SELECT c.id, 'وكالات دعاية وإعلان', 'marketing-agencies', 'Megaphone', 1 FROM categories c WHERE c.slug = 'marketing'
UNION ALL SELECT c.id, 'إدارة سوشيال ميديا', 'marketing-social', 'Share2', 2 FROM categories c WHERE c.slug = 'marketing'
UNION ALL SELECT c.id, 'تصميم جرافيك', 'marketing-design', 'Palette', 3 FROM categories c WHERE c.slug = 'marketing'
UNION ALL SELECT c.id, 'تصوير فوتوغرافي', 'marketing-photo', 'Camera', 4 FROM categories c WHERE c.slug = 'marketing'
UNION ALL SELECT c.id, 'طباعة ودعاية', 'marketing-print', 'Printer', 5 FROM categories c WHERE c.slug = 'marketing';

-- 5. Drivers
INSERT INTO subcategories (category_id, name, slug, icon, sort_order)
SELECT c.id, 'توصيل ودفارة', 'drivers-delivery', 'Bike', 1 FROM categories c WHERE c.slug = 'drivers'
UNION ALL SELECT c.id, 'سطحات ونقل أثاث', 'drivers-trucks', 'Truck', 2 FROM categories c WHERE c.slug = 'drivers'
UNION ALL SELECT c.id, 'نقل وشحن', 'drivers-shipping', 'Package', 3 FROM categories c WHERE c.slug = 'drivers'
UNION ALL SELECT c.id, 'تكاسي وليموزين', 'drivers-taxi', 'Car', 4 FROM categories c WHERE c.slug = 'drivers'
UNION ALL SELECT c.id, 'نقل بضائع', 'drivers-cargo', 'Container', 5 FROM categories c WHERE c.slug = 'drivers';

-- 6. Groceries
INSERT INTO subcategories (category_id, name, slug, icon, sort_order)
SELECT c.id, 'بقالات وتموينات', 'groceries-stores', 'ShoppingBag', 1 FROM categories c WHERE c.slug = 'groceries'
UNION ALL SELECT c.id, 'سوبرماركت', 'groceries-supermarket', 'ShoppingCart', 2 FROM categories c WHERE c.slug = 'groceries'
UNION ALL SELECT c.id, 'إلكترونيات وأجهزة', 'groceries-electronics', 'Smartphone', 3 FROM categories c WHERE c.slug = 'groceries'
UNION ALL SELECT c.id, 'ملابس وأزياء', 'groceries-clothing', 'Shirt', 4 FROM categories c WHERE c.slug = 'groceries'
UNION ALL SELECT c.id, 'تسوق أونلاين', 'groceries-online', 'MonitorSmartphone', 5 FROM categories c WHERE c.slug = 'groceries';

-- 7. Cars
INSERT INTO subcategories (category_id, name, slug, icon, sort_order)
SELECT c.id, 'بيع سيارات', 'cars-sell', 'Car', 1 FROM categories c WHERE c.slug = 'cars'
UNION ALL SELECT c.id, 'شراء سيارات', 'cars-buy', 'HandCoins', 2 FROM categories c WHERE c.slug = 'cars'
UNION ALL SELECT c.id, 'تأجير سيارات', 'cars-rent', 'KeyRound', 3 FROM categories c WHERE c.slug = 'cars'
UNION ALL SELECT c.id, 'صيانة وقطع غيار', 'cars-maintenance', 'Wrench', 4 FROM categories c WHERE c.slug = 'cars'
UNION ALL SELECT c.id, 'معارض سيارات', 'cars-showroom', 'Store', 5 FROM categories c WHERE c.slug = 'cars';

-- 8. Real Estate
INSERT INTO subcategories (category_id, name, slug, icon, sort_order)
SELECT c.id, 'بيع عقارات', 'realestate-sell', 'Home', 1 FROM categories c WHERE c.slug = 'real-estate'
UNION ALL SELECT c.id, 'إيجار عقارات', 'realestate-rent', 'Key', 2 FROM categories c WHERE c.slug = 'real-estate'
UNION ALL SELECT c.id, 'شقق وفلل', 'realestate-apartments', 'Building2', 3 FROM categories c WHERE c.slug = 'real-estate'
UNION ALL SELECT c.id, 'أراضي', 'realestate-land', 'Map', 4 FROM categories c WHERE c.slug = 'real-estate'
UNION ALL SELECT c.id, 'مقاولات وبناء', 'realestate-construction', 'HardHat', 5 FROM categories c WHERE c.slug = 'real-estate'
UNION ALL SELECT c.id, 'ديكور وتشطيبات', 'realestate-decor', 'Paintbrush', 6 FROM categories c WHERE c.slug = 'real-estate';

-- 9. Health
INSERT INTO subcategories (category_id, name, slug, icon, sort_order)
SELECT c.id, 'مستشفيات', 'health-hospitals', 'Hospital', 1 FROM categories c WHERE c.slug = 'health'
UNION ALL SELECT c.id, 'عيادات وأطباء', 'health-clinics', 'Stethoscope', 2 FROM categories c WHERE c.slug = 'health'
UNION ALL SELECT c.id, 'مختبرات وتحاليل', 'health-labs', 'TestTube', 3 FROM categories c WHERE c.slug = 'health'
UNION ALL SELECT c.id, 'صيدليات', 'health-pharmacy', 'Pill', 4 FROM categories c WHERE c.slug = 'health'
UNION ALL SELECT c.id, 'طب أسنان', 'health-dental', 'Smile', 5 FROM categories c WHERE c.slug = 'health'
UNION ALL SELECT c.id, 'طوارئ وإسعاف', 'health-emergency', 'Ambulance', 6 FROM categories c WHERE c.slug = 'health';

-- 10. Business & Jobs
INSERT INTO subcategories (category_id, name, slug, icon, sort_order)
SELECT c.id, 'شركات ومؤسسات', 'business-companies', 'Building', 1 FROM categories c WHERE c.slug = 'business-jobs'
UNION ALL SELECT c.id, 'وظائف شاغرة', 'business-jobs-board', 'Briefcase', 2 FROM categories c WHERE c.slug = 'business-jobs'
UNION ALL SELECT c.id, 'خدمات استشارية', 'business-consulting', 'Lightbulb', 3 FROM categories c WHERE c.slug = 'business-jobs'
UNION ALL SELECT c.id, 'تدريب وتوظيف', 'business-training', 'Users', 4 FROM categories c WHERE c.slug = 'business-jobs'
UNION ALL SELECT c.id, 'سيرة ذاتية', 'business-cv', 'FileText', 5 FROM categories c WHERE c.slug = 'business-jobs';

-- 11. Craftsmen
INSERT INTO subcategories (category_id, name, slug, icon, sort_order)
SELECT c.id, 'كهربائيون', 'craftsmen-electrician', 'Zap', 1 FROM categories c WHERE c.slug = 'craftsmen'
UNION ALL SELECT c.id, 'سباكون', 'craftsmen-plumber', 'Droplets', 2 FROM categories c WHERE c.slug = 'craftsmen'
UNION ALL SELECT c.id, 'نجارون', 'craftsmen-carpenter', 'Hammer', 3 FROM categories c WHERE c.slug = 'craftsmen'
UNION ALL SELECT c.id, 'حدادون', 'craftsmen-blacksmith', 'Anvil', 4 FROM categories c WHERE c.slug = 'craftsmen'
UNION ALL SELECT c.id, 'تكييف وتبريد', 'craftsmen-ac', 'Wind', 5 FROM categories c WHERE c.slug = 'craftsmen'
UNION ALL SELECT c.id, 'صيانة أجهزة', 'craftsmen-appliance', 'Settings', 6 FROM categories c WHERE c.slug = 'craftsmen';

-- 12. Government
INSERT INTO subcategories (category_id, name, slug, icon, sort_order)
SELECT c.id, 'محاماة واستشارات قانونية', 'gov-legal', 'Scale', 1 FROM categories c WHERE c.slug = 'government'
UNION ALL SELECT c.id, 'ترجمة قانونية', 'gov-translation', 'Languages', 2 FROM categories c WHERE c.slug = 'government'
UNION ALL SELECT c.id, 'معاملات حكومية', 'gov-services', 'FileCheck', 3 FROM categories c WHERE c.slug = 'government'
UNION ALL SELECT c.id, 'جوازات وتأشيرات', 'gov-passport', 'BookUser', 4 FROM categories c WHERE c.slug = 'government'
UNION ALL SELECT c.id, 'عدل وشهادات', 'gov-notary', 'Stamp', 5 FROM categories c WHERE c.slug = 'government';

-- 13. Education
INSERT INTO subcategories (category_id, name, slug, icon, sort_order)
SELECT c.id, 'جامعات ومعاهد', 'edu-universities', 'GraduationCap', 1 FROM categories c WHERE c.slug = 'education'
UNION ALL SELECT c.id, 'دورات تدريبية', 'edu-courses', 'BookOpen', 2 FROM categories c WHERE c.slug = 'education'
UNION ALL SELECT c.id, 'دروس خصوصية', 'edu-tutoring', 'Pencil', 3 FROM categories c WHERE c.slug = 'education'
UNION ALL SELECT c.id, 'مدارس', 'edu-schools', 'School', 4 FROM categories c WHERE c.slug = 'education'
UNION ALL SELECT c.id, 'مراكز تدريب', 'edu-centers', 'Award', 5 FROM categories c WHERE c.slug = 'education';

-- 14. Finance
INSERT INTO subcategories (category_id, name, slug, icon, sort_order)
SELECT c.id, 'بنوك ومصارف', 'fin-banks', 'Landmark', 1 FROM categories c WHERE c.slug = 'finance'
UNION ALL SELECT c.id, 'صرافة وتحويلات', 'fin-exchange', 'Banknote', 2 FROM categories c WHERE c.slug = 'finance'
UNION ALL SELECT c.id, 'تأمين', 'fin-insurance', 'ShieldCheck', 3 FROM categories c WHERE c.slug = 'finance'
UNION ALL SELECT c.id, 'محاسبة وضرائب', 'fin-accounting', 'Calculator', 4 FROM categories c WHERE c.slug = 'finance'
UNION ALL SELECT c.id, 'خدمات مالية', 'fin-services', 'Wallet', 5 FROM categories c WHERE c.slug = 'finance';

-- 15. Events
INSERT INTO subcategories (category_id, name, slug, icon, sort_order)
SELECT c.id, 'صالات أفراح', 'events-halls', 'PartyPopper', 1 FROM categories c WHERE c.slug = 'events'
UNION ALL SELECT c.id, 'تنظيم مناسبات', 'events-planning', 'Calendar', 2 FROM categories c WHERE c.slug = 'events'
UNION ALL SELECT c.id, 'تصوير مناسبات', 'events-photo', 'Camera', 3 FROM categories c WHERE c.slug = 'events'
UNION ALL SELECT c.id, 'ضيافة وتموين', 'events-catering', 'UtensilsCrossed', 4 FROM categories c WHERE c.slug = 'events'
UNION ALL SELECT c.id, 'ديكور مناسبات', 'events-decor', 'Flower2', 5 FROM categories c WHERE c.slug = 'events';

-- 16. Beauty
INSERT INTO subcategories (category_id, name, slug, icon, sort_order)
SELECT c.id, 'صالونات نسائية', 'beauty-salon', 'Scissors', 1 FROM categories c WHERE c.slug = 'beauty'
UNION ALL SELECT c.id, 'صالونات رجالية', 'beauty-barber', 'User', 2 FROM categories c WHERE c.slug = 'beauty'
UNION ALL SELECT c.id, 'مراكز تجميل', 'beauty-center', 'Sparkles', 3 FROM categories c WHERE c.slug = 'beauty'
UNION ALL SELECT c.id, 'ملابس وأزياء', 'beauty-fashion', 'Shirt', 4 FROM categories c WHERE c.slug = 'beauty'
UNION ALL SELECT c.id, 'نوادي رياضية', 'beauty-gym', 'Dumbbell', 5 FROM categories c WHERE c.slug = 'beauty';

-- 17. Agriculture
INSERT INTO subcategories (category_id, name, slug, icon, sort_order)
SELECT c.id, 'مزارع وإنتاج زراعي', 'agri-farms', 'Wheat', 1 FROM categories c WHERE c.slug = 'agriculture'
UNION ALL SELECT c.id, 'مواشي وثروة حيوانية', 'agri-livestock', 'Milk', 2 FROM categories c WHERE c.slug = 'agriculture'
UNION ALL SELECT c.id, 'دواجن وبيض', 'agri-poultry', 'Egg', 3 FROM categories c WHERE c.slug = 'agriculture'
UNION ALL SELECT c.id, 'بيطري', 'agri-vet', 'Stethoscope', 4 FROM categories c WHERE c.slug = 'agriculture'
UNION ALL SELECT c.id, 'بذور وأسمدة', 'agri-supplies', 'Sprout', 5 FROM categories c WHERE c.slug = 'agriculture';

-- 18. Community
INSERT INTO subcategories (category_id, name, slug, icon, sort_order)
SELECT c.id, 'جمعيات خيرية', 'comm-charity', 'HeartHandshake', 1 FROM categories c WHERE c.slug = 'community'
UNION ALL SELECT c.id, 'تبرع بالدم', 'comm-blood', 'Droplet', 2 FROM categories c WHERE c.slug = 'community'
UNION ALL SELECT c.id, 'مفقودات ومفقودون', 'comm-missing', 'Search', 3 FROM categories c WHERE c.slug = 'community'
UNION ALL SELECT c.id, 'سوق المستعمل', 'comm-market', 'Tag', 4 FROM categories c WHERE c.slug = 'community'
UNION ALL SELECT c.id, 'إغاثة وطوارئ', 'comm-relief', 'LifeBuoy', 5 FROM categories c WHERE c.slug = 'community';
