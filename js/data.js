/* =========================================================
   KRISHNA COMPUTER — store data
   Edit this file to change shop details, categories and products.
   ========================================================= */
window.KC = (() => {
  const SHOP = {
    name: 'Krishna Computer',
    tagline: 'Sales • Service • Support for Computers, Printers, CCTV, Networking & AC',
    slogan: 'Your Trusted Partner for Digital Solutions',
    phones: ['6376216509', '9057354025'],
    whatsapp: '916376216509',          // country code + number, used for orders & enquiries
    headOffice: '46, Ashok Vihar, Prem Nagar, Agra Road, Jaipur, Rajasthan – 302031',
    shop: 'Shop No. 3, KL Plaza, Agra Road, Jaipur, Rajasthan – 302031',
    mapQuery: 'KL Plaza, Agra Road, Jaipur, Rajasthan 302031',
    gstin: '08EAEPD1634R1ZF',
    hours: 'Mon – Sat: 10:00 AM – 8:00 PM',
    loginToViewPrice: true,            // set false to show prices to everyone
    freeDeliveryAbove: 2000
  };

  // Groups shown in the mega-menu. c1/c2 = colours used for product artwork.
  const GROUPS = [
    { id: 'computer-cables', name: 'Computer Cables', icon: 'hdmi', c1: '#1e5eff', c2: '#0b2f8a' },
    { id: 'computer-accessories', name: 'Computer Accessories', icon: 'keyboard', c1: '#7b4dff', c2: '#3b1d9e' },
    { id: 'cctv-security', name: 'CCTV & Security', icon: 'cctv', c1: '#ff4d5e', c2: '#9e1426' },
    { id: 'printer-accessories', name: 'Printer Accessories', icon: 'printer', c1: '#0fb5a6', c2: '#05665e' },
    { id: 'laptop-accessories', name: 'Laptop Accessories', icon: 'laptop', c1: '#3d6bff', c2: '#20307a' },
    { id: 'networking', name: 'Networking', icon: 'router', c1: '#16b364', c2: '#08663a' },
    { id: 'storage-memory', name: 'Storage & Memory', icon: 'hdd', c1: '#ff8a1e', c2: '#a14800' },
    { id: 'converters-more', name: 'Converters & More', icon: 'converter', c1: '#e8458b', c2: '#86164a' }
  ];

  const CATEGORIES = [
    { id: 'vga-cable', name: 'VGA Cables', group: 'computer-cables', icon: 'vga' },
    { id: 'hdmi-cable', name: 'HDMI Cables', group: 'computer-cables', icon: 'hdmi' },
    { id: 'power-cable', name: 'Power Cables', group: 'computer-cables', icon: 'power' },
    { id: 'usb-cable', name: 'USB & Data Cables', group: 'computer-cables', icon: 'usb' },
    { id: 'keyboard-mouse', name: 'Keyboard & Mouse', group: 'computer-accessories', icon: 'keyboard' },
    { id: 'mousepad', name: 'Mousepads', group: 'computer-accessories', icon: 'mousepad' },
    { id: 'tools', name: 'Tools & Kits', group: 'computer-accessories', icon: 'tools' },
    { id: 'switches-splitters', name: 'Switches & Splitters', group: 'computer-accessories', icon: 'switch' },
    { id: 'extenders', name: 'Extenders', group: 'computer-accessories', icon: 'extender' },
    { id: 'webcam', name: 'Webcams', group: 'computer-accessories', icon: 'webcam' },
    { id: 'cctv-camera', name: 'CCTV Cameras', group: 'cctv-security', icon: 'cctv' },
    { id: 'bnc-dc', name: 'BNC & DC', group: 'cctv-security', icon: 'connector' },
    { id: 'cctv-cable', name: 'CCTV Cable', group: 'cctv-security', icon: 'cable' },
    { id: 'dvr-nvr', name: 'DVR / NVR', group: 'cctv-security', icon: 'dvr' },
    { id: 'dvr-rack', name: 'DVR Rack & Stands', group: 'cctv-security', icon: 'wallmount' },
    { id: 'cartridge', name: 'Cartridges', group: 'printer-accessories', icon: 'cartridge' },
    { id: 'toner', name: 'Toner Powder', group: 'printer-accessories', icon: 'toner' },
    { id: 'opc-drum', name: 'OPC Drum', group: 'printer-accessories', icon: 'drum' },
    { id: 'refurbished-printer', name: 'Refurbished Printers', group: 'printer-accessories', icon: 'printer' },
    { id: 'laptop-adapter', name: 'Laptop Adapters', group: 'laptop-accessories', icon: 'adapter' },
    { id: 'laptop-bag', name: 'Laptop Bags', group: 'laptop-accessories', icon: 'bag' },
    { id: 'laptop-battery', name: 'Laptop Batteries', group: 'laptop-accessories', icon: 'battery' },
    { id: 'type-c', name: 'Type-C Products', group: 'laptop-accessories', icon: 'typec' },
    { id: 'lan-cable', name: 'LAN Cables & Patch Cords', group: 'networking', icon: 'lan' },
    { id: 'crimping-tools', name: 'Crimping Tools', group: 'networking', icon: 'crimp' },
    { id: 'router', name: 'Routers & Switches', group: 'networking', icon: 'router' },
    { id: 'add-on-card', name: 'Add-on Cards', group: 'networking', icon: 'card' },
    { id: 'hard-drive', name: 'Hard Drives', group: 'storage-memory', icon: 'hdd' },
    { id: 'ssd', name: 'SSD', group: 'storage-memory', icon: 'ssd' },
    { id: 'ram', name: 'RAM & CMOS', group: 'storage-memory', icon: 'ram' },
    { id: 'pendrive', name: 'Pendrives & Cards', group: 'storage-memory', icon: 'pendrive' },
    { id: 'converter', name: 'Converters', group: 'converters-more', icon: 'converter' },
    { id: 'wall-mount', name: 'Wall Mounts', group: 'converters-more', icon: 'wallmount' },
    { id: 'adaptor', name: 'Power Adaptors (SMPS)', group: 'converters-more', icon: 'adapter' },
    { id: 'connector', name: 'Connectors & Jointers', group: 'converters-more', icon: 'connector' },
    { id: 'led-tv', name: 'LED TV & Monitors', group: 'converters-more', icon: 'tv' }
  ];

  // P(name, category, brand, price, mrp, tags, moq, inStock)
  // tags: new = New Arrival, best = Best Selling, deal = Daily Deal, lot = Stock Lot
  let n = 0;
  const P = (name, cat, brand, price, mrp, tags = '', moq = 1, stock = true) =>
    ({ id: 'kc' + String(++n).padStart(3, '0'), name, cat, brand, price, mrp, tags: tags.split(' ').filter(Boolean), moq, stock });

  const PRODUCTS = [
    P('VGA Cable Male to Male 1.5M', 'vga-cable', 'Krishna', 120, 199, 'best'),
    P('VGA Cable Male to Male 5M Heavy', 'vga-cable', 'Krishna', 260, 399),
    P('VGA Cable 10M with Ferrite Core', 'vga-cable', 'Zebronics', 420, 650, 'deal'),
    P('HDMI Cable 1.5M 4K Gold Plated', 'hdmi-cable', 'Krishna', 150, 299, 'best'),
    P('HDMI Cable 3M 4K 60Hz Braided', 'hdmi-cable', 'Zebronics', 260, 449, 'new'),
    P('HDMI Cable 10M 4K Heavy Duty', 'hdmi-cable', 'Krishna', 650, 999),
    P('HDMI Cable 20M Active Fiber', 'hdmi-cable', 'D-Link', 2450, 3499, 'deal'),
    P('Desktop Power Cable 1.5M (3 Pin)', 'power-cable', 'Krishna', 85, 150, 'best', 5),
    P('Laptop Power Cable (Clover / 3 Pin)', 'power-cable', 'Krishna', 75, 140, '', 5),
    P('Printer Power Cable (2 Pin)', 'power-cable', 'Krishna', 60, 120, '', 5),
    P('USB 2.0 Printer Cable 1.5M', 'usb-cable', 'Krishna', 90, 160, 'best'),
    P('USB Extension Cable 3M Male to Female', 'usb-cable', 'Zebronics', 140, 250),
    P('SATA Data Cable (Straight)', 'usb-cable', 'Krishna', 35, 80, 'best', 10),
    P('9 Pin Serial Cable Male to Female 3M (DB9)', 'usb-cable', 'Krishna', 180, 299),
    P('USB Wired Keyboard Full Size', 'keyboard-mouse', 'Logitech', 520, 795, 'best'),
    P('USB Optical Mouse 1000 DPI', 'keyboard-mouse', 'Dell', 260, 450, 'best'),
    P('Wireless Keyboard & Mouse Combo', 'keyboard-mouse', 'HP', 1150, 1799, 'new deal'),
    P('Gaming Mouse RGB 7200 DPI', 'keyboard-mouse', 'Zebronics', 520, 899, 'new'),
    P('Mousepad Standard (Black)', 'mousepad', 'Krishna', 40, 99, '', 10),
    P('Extended Gaming Mousepad 800x300mm', 'mousepad', 'Zebronics', 320, 599, 'new'),
    P('Mousepad with Wrist Rest', 'mousepad', 'Krishna', 120, 249),
    P('Computer Repair Toolkit 45-in-1', 'tools', 'Krishna', 450, 799, 'deal'),
    P('Anti-Static Wrist Band', 'tools', 'Krishna', 60, 150, '', 5),
    P('Thermal Paste 3g Syringe', 'tools', 'Krishna', 70, 150, 'best', 5),
    P('HDMI Splitter 1x2 4K', 'switches-splitters', 'D-Link', 650, 1099),
    P('HDMI Switch 3x1 with Remote', 'switches-splitters', 'Krishna', 780, 1299, 'new'),
    P('KVM Switch 2 Port USB', 'switches-splitters', 'D-Link', 1350, 1999),
    P('HDMI Extender 60M over LAN', 'extenders', 'Krishna', 1650, 2499),
    P('USB Extender 50M over RJ45', 'extenders', 'Krishna', 950, 1499),
    P('Webcam Full HD 1080P with Mic', 'webcam', 'Logitech', 1450, 2499, 'lot new'),
    P('Webcam HD 720P USB', 'webcam', 'Zebronics', 690, 1199, 'lot'),
    P('2MP HD Dome Camera (Indoor)', 'cctv-camera', 'CP Plus', 1050, 1650, 'best'),
    P('2MP HD Bullet Camera (Outdoor)', 'cctv-camera', 'Hikvision', 1190, 1850, 'best'),
    P('4MP IP Bullet Camera POE', 'cctv-camera', 'Hikvision', 3250, 4599, 'new'),
    P('Wi-Fi Smart Camera 360° 3MP', 'cctv-camera', 'CP Plus', 1890, 2999, 'new deal'),
    P('BNC Connector (Screw Type)', 'bnc-dc', 'Krishna', 8, 20, 'best', 50),
    P('DC Connector Male (Green Screw)', 'bnc-dc', 'Krishna', 9, 20, '', 50),
    P('DC Power Cable Deluxe (Pair)', 'bnc-dc', 'Krishna', 25, 60, 'best', 10),
    P('CCTV Cable 3+1 Copper 90M', 'cctv-cable', 'CP Plus', 1150, 1650, 'best'),
    P('CCTV Cable 3+1 Copper 180M', 'cctv-cable', 'CP Plus', 2150, 2999),
    P('POE Cable for IP Camera (Non-POE)', 'cctv-cable', 'Krishna', 160, 299),
    P('4 Channel DVR 1080P Lite', 'dvr-nvr', 'CP Plus', 2350, 3499, 'best'),
    P('8 Channel DVR 5MP', 'dvr-nvr', 'Hikvision', 4150, 5999),
    P('8 Channel NVR 4K POE', 'dvr-nvr', 'Hikvision', 7900, 10999, 'new'),
    P('DVR Rack 2U Wall Mount', 'dvr-rack', 'Krishna', 850, 1399),
    P('Junction Box 5x5 Premium', 'dvr-rack', 'Krishna', 55, 120, 'best', 10),
    P('CCTV Dome Wall Mount Bracket (Big)', 'dvr-rack', 'Krishna', 95, 180, 'new', 5),
    P('CCTV Rain Cap Cover', 'dvr-rack', 'Krishna', 45, 99, 'new', 10),
    P('Ink Cartridge 803 Black (Compatible)', 'cartridge', 'HP', 520, 799, 'best'),
    P('Toner Cartridge 12A (Compatible)', 'cartridge', 'HP', 650, 1199, 'best deal'),
    P('Canon 925 Toner Cartridge (Compatible)', 'cartridge', 'Canon', 690, 1250),
    P('Epson 003 Ink Bottle Set (4 Colours)', 'cartridge', 'Epson', 980, 1356, 'new'),
    P('Toner Powder 1KG (HP / Canon)', 'toner', 'Krishna', 950, 1600),
    P('Toner Powder 100g Refill Bottle', 'toner', 'Krishna', 140, 250, 'best', 5),
    P('OPC Drum 12A / 88A', 'opc-drum', 'Krishna', 220, 450, '', 5),
    P('HP LaserJet 1005 Printer (Refurbished)', 'refurbished-printer', 'HP', 6500, 9500, 'lot', 1, false),
    P('Canon LBP 2900B Printer (Refurbished)', 'refurbished-printer', 'Canon', 7200, 10500, 'lot', 1, 'low'),
    P('Laptop Adapter 65W (HP Pin)', 'laptop-adapter', 'HP', 750, 1299, 'best'),
    P('Laptop Adapter 65W (Dell Pin)', 'laptop-adapter', 'Dell', 750, 1299),
    P('Laptop Adapter 65W Type-C PD', 'laptop-adapter', 'Lenovo', 1150, 1899, 'new'),
    P('Laptop Backpack 15.6" Water Resistant', 'laptop-bag', 'Dell', 690, 1499, 'deal'),
    P('Laptop Sleeve 14"', 'laptop-bag', 'Krishna', 320, 699),
    P('Laptop Battery (HP 15 Series)', 'laptop-battery', 'HP', 1950, 2999),
    P('Type-C OTG (Type-C Female to USB Male)', 'type-c', 'Krishna', 60, 149, 'best', 5),
    P('Type-C to HDMI 4K Adapter', 'type-c', 'Krishna', 520, 899, 'new'),
    P('Type-C 7-in-1 Multiport Hub', 'type-c', 'Zebronics', 1450, 2499, 'new deal'),
    P('CAT6 Patch Cord 1.5M (LAN Cable)', 'lan-cable', 'D-Link', 70, 150, 'best', 5),
    P('CAT6 LAN Cable Box 305M', 'lan-cable', 'D-Link', 6900, 9500, 'deal'),
    P('RJ45 Connector CAT6 (100 Pcs)', 'lan-cable', 'D-Link', 380, 600, 'best'),
    P('RJ45 Connector CAT7 Metal', 'lan-cable', 'Krishna', 25, 50, '', 5),
    P('RJ11 Connector 2 Pin (100 Pcs)', 'lan-cable', 'Krishna', 150, 299),
    P('RJ45 Crimping Tool with Cutter', 'crimping-tools', 'Krishna', 280, 499, 'best'),
    P('LAN Cable Tester', 'crimping-tools', 'Krishna', 240, 450),
    P('Wi-Fi Router 300Mbps', 'router', 'TP-Link', 1050, 1599, 'best'),
    P('Dual Band Wi-Fi Router AC1200', 'router', 'TP-Link', 1890, 2999, 'new'),
    P('8 Port Gigabit Switch', 'router', 'D-Link', 1150, 1799),
    P('USB Wi-Fi Adapter 300Mbps', 'add-on-card', 'TP-Link', 450, 799),
    P('NVMe to PCIe x4 Card', 'add-on-card', 'Krishna', 450, 899, 'new'),
    P('PCI-E Gigabit LAN Card', 'add-on-card', 'TP-Link', 520, 899),
    P('Internal HDD 1TB 3.5" (Surveillance)', 'hard-drive', 'Seagate', 3350, 4599, 'best'),
    P('Internal HDD 2TB 3.5" (Surveillance)', 'hard-drive', 'WD', 5200, 6999),
    P('2.5" HDD Casing USB 3.0', 'hard-drive', 'Seagate', 290, 599, 'new'),
    P('SSD 256GB SATA 2.5"', 'ssd', 'Kingston', 1650, 2499, 'best deal'),
    P('SSD 512GB NVMe M.2', 'ssd', 'WD', 2950, 4499, 'new'),
    P('DDR4 8GB 3200MHz Desktop RAM', 'ram', 'Kingston', 1650, 2399),
    P('DDR4 8GB 3200MHz Laptop RAM', 'ram', 'Kingston', 1690, 2499),
    P('CMOS Battery CR2032 3V', 'ram', 'Duracell', 25, 60, 'new', 5),
    P('Pendrive 32GB USB 3.2', 'pendrive', 'SanDisk', 310, 549, 'best'),
    P('Pendrive 64GB USB 3.2', 'pendrive', 'SanDisk', 470, 799),
    P('MicroSD Card 64GB Class 10', 'pendrive', 'SanDisk', 520, 899, 'deal'),
    P('HDMI to VGA Converter with Audio', 'converter', 'Krishna', 220, 450, 'best'),
    P('DP to VGA Cable 1.5M', 'converter', 'Krishna', 280, 499, 'new'),
    P('VGA to HDMI Converter', 'converter', 'Krishna', 320, 599),
    P('LED TV Wall Mount 14"–32" Fixed', 'wall-mount', 'Krishna', 220, 450),
    P('LED TV Wall Mount 32"–55" Tilt', 'wall-mount', 'Krishna', 520, 999, 'deal'),
    P('CCTV / Projector Ceiling Mount 2ft', 'wall-mount', 'Krishna', 450, 799, 'new'),
    P('12V 2A SMPS Adaptor', 'adaptor', 'Krishna', 120, 250, 'best', 5),
    P('12V 10A SMPS Power Supply (CCTV)', 'adaptor', 'Krishna', 450, 799),
    P('24V Adaptor (Epson Printer)', 'adaptor', 'Epson', 650, 1099, 'new'),
    P('DP Jointer (Female to Female)', 'connector', 'Krishna', 120, 250, 'new'),
    P('HDMI Jointer (Female to Female)', 'connector', 'Krishna', 50, 120, '', 5),
    P('LED Monitor 19.5" HD', 'led-tv', 'Dell', 5650, 7999, 'lot'),
    P('LED Monitor 22" Full HD IPS', 'led-tv', 'HP', 7350, 9999, 'new'),
    P('LED TV 32" HD Ready', 'led-tv', 'Krishna', 8900, 12999, 'deal')
  ];

  /* ---------- PRODUCT IMAGES ----------
     Every product gets an image from images/products/.
     1) PHOTOS: put a real photo in images/products/ and map the product SKU to it here.
        e.g.  kc001: 'images/products/kc001.jpg'   (SKU is shown on each product page)
     2) IMAGE_RULES: first rule whose pattern matches the product name wins.
     3) Otherwise the category's default image (CATEGORY_IMAGES) is used. */
  const PHOTOS = {
    // kc001: 'images/products/kc001.jpg',
    // several photos make a gallery with thumbnails:
    // kc002: ['images/products/kc002-front.jpg', 'images/products/kc002-side.jpg'],
  };

  /* ---------- PRODUCT DETAILS (shown on the product page) ----------
     Optional per product: model, warranty, note. Warranty defaults to the manufacturer's. */
  const DETAILS = {
    // kc057: { model: 'LaserJet 1005', warranty: '7 days testing warranty from date of billing' },
  };

  const IMAGE_RULES = [
    [/braided/i, 'hdmi-braided'],
    [/sata data cable/i, 'sata'],
    [/9 pin|db9|serial/i, 'db9'],
    [/dp to vga/i, 'dp-vga'],
    [/wireless keyboard|combo/i, 'combo'],
    [/keyboard/i, 'keyboard'],
    [/gaming mouse\b/i, 'gaming-mouse'],
    [/optical mouse/i, 'mouse'],
    [/extended|gaming mousepad/i, 'mousepad-xl'],
    [/wrist rest/i, 'mousepad-rest'],
    [/thermal paste/i, 'paste'],
    [/wrist band/i, 'wristband'],
    [/hdmi switch/i, 'hdmi-switch'],
    [/kvm/i, 'kvm'],
    [/dome camera/i, 'dome'],
    [/wi-?fi smart camera|360°/i, 'wifi-cam'],
    [/dc connector/i, 'dc-connector'],
    [/dc power cable/i, 'dc-cable'],
    [/poe cable/i, 'poe'],
    [/nvr/i, 'nvr'],
    [/junction box/i, 'junction'],
    [/dome wall mount|wall mount bracket/i, 'bracket'],
    [/rain cap/i, 'raincap'],
    [/ceiling mount/i, 'ceiling-mount'],
    [/toner cartridge/i, 'toner-cart'],
    [/ink bottle/i, 'ink-bottles'],
    [/type-c pd/i, 'charger-c'],
    [/sleeve/i, 'sleeve'],
    [/otg/i, 'otg'],
    [/type-c to hdmi/i, 'c-hdmi'],
    [/cable box|305m/i, 'cable-box'],
    [/rj45 connector|rj11/i, 'rj45-pack'],
    [/tester/i, 'tester'],
    [/gigabit switch|\d+ port/i, 'switch8'],
    [/dual band|ac1200/i, 'router-ac'],
    [/usb wi-?fi adapter/i, 'wifi-usb'],
    [/nvme to pci/i, 'nvme-card'],
    [/casing/i, 'hdd-case'],
    [/m\.2/i, 'nvme'],
    [/laptop ram/i, 'ram-laptop'],
    [/cmos/i, 'cmos'],
    [/microsd|sd card/i, 'microsd'],
    [/vga to hdmi/i, 'vga-hdmi'],
    [/10a|power supply/i, 'smps-box'],
    [/led tv \d/i, 'tv']
  ];

  const CATEGORY_IMAGES = {
    'vga-cable': 'vga', 'hdmi-cable': 'hdmi', 'power-cable': 'power', 'usb-cable': 'usb',
    'keyboard-mouse': 'combo', mousepad: 'mousepad', tools: 'toolkit', 'switches-splitters': 'hdmi-splitter',
    extenders: 'extender', webcam: 'webcam', 'cctv-camera': 'bullet', 'bnc-dc': 'bnc', 'cctv-cable': 'cctv-coil',
    'dvr-nvr': 'dvr', 'dvr-rack': 'rack', cartridge: 'ink', toner: 'toner-bottle', 'opc-drum': 'drum',
    'refurbished-printer': 'printer', 'laptop-adapter': 'adapter-laptop', 'laptop-bag': 'backpack',
    'laptop-battery': 'battery', 'type-c': 'c-hub', 'lan-cable': 'lan', 'crimping-tools': 'crimper',
    router: 'router', 'add-on-card': 'lan-card', 'hard-drive': 'hdd', ssd: 'ssd', ram: 'ram', pendrive: 'pendrive',
    converter: 'hdmi-vga', 'wall-mount': 'tv-mount', adaptor: 'smps', connector: 'jointer', 'led-tv': 'monitor'
  };
  const imgPath = key => `images/products/${key}.svg`;
  PRODUCTS.forEach(p => {
    const rule = IMAGE_RULES.find(([re]) => re.test(p.name));
    const photos = PHOTOS[p.id];
    p.imgs = photos ? [].concat(photos) : [imgPath(rule ? rule[1] : CATEGORY_IMAGES[p.cat])];
    p.img = p.imgs[0];
    Object.assign(p, DETAILS[p.id] || {});
  });
  CATEGORIES.forEach(c => { c.img = imgPath(CATEGORY_IMAGES[c.id]); });

  const BRANDS = ['HP', 'Dell', 'Lenovo', 'Logitech', 'Hikvision', 'CP Plus', 'TP-Link', 'D-Link', 'Seagate', 'WD', 'Kingston', 'SanDisk', 'Canon', 'Epson', 'Zebronics', 'Duracell'];

  // The eight services from the Krishna Computer banner
  const SERVICES = [
    { icon: 'laptop', title: 'Computer & Laptop Sale', short: 'Computer & Laptop Sale', text: 'Desktops, laptops, monitors and accessories, with service and support after the sale.' },
    { icon: 'tools', title: 'Printer Repairing', short: 'Printer Repairing', text: 'Repair and servicing of inkjet and laser printers for homes and offices.' },
    { icon: 'printer', title: 'Printer Sale & Purchase', short: 'Printer Sale & Purchase', text: 'Buy new or refurbished printers, or sell us your old printer.' },
    { icon: 'ink', title: 'Printer Ink & Cartridge', short: 'Printer Ink & Cartridge', text: 'Ink bottles, cartridges, toner and refilling for popular printer brands.', href: '#/category/printer-accessories' },
    { icon: 'ac', title: 'AC Repairing', short: 'AC Repairing', text: 'Air conditioner servicing, repair and installation.' },
    { icon: 'cctv', title: 'CCTV Installation', short: 'CCTV Installation', text: 'Camera, DVR/NVR and cabling installation with mobile view setup.' },
    { icon: 'router', title: 'Networking Solutions', short: 'Networking Solutions', text: 'LAN cabling, router and switch setup, Wi-Fi for homes, shops and offices.' },
    { icon: 'handshake', title: 'AMC Services', short: 'AMC Services', text: 'Annual maintenance contracts for computers, printers and CCTV.' }
  ];

  const SLIDES = [
    { brand: true },   // the Krishna Computer banner slide
    { kicker: 'CCTV & Security', title: 'Complete CCTV Solutions', text: 'Cameras, DVR/NVR, cables and installation — from one shop.', cta: 'Shop CCTV', href: '#/category/cctv-security', icon: 'cctv', img: 'images/products/bullet.svg', c1: '#011c4f', c2: '#e3141c' },
    { kicker: 'Wholesale Prices', title: 'Computer Cables & Accessories', text: 'HDMI, VGA, LAN, power cables, keyboards, mice and more in bulk.', cta: 'Explore Cables', href: '#/category/computer-cables', icon: 'hdmi', img: 'images/products/hdmi.svg', c1: '#012a6b', c2: '#1d74e8' },
    { kicker: 'Printer Accessories', title: 'Cartridges, Toner & Refills', text: 'Compatible cartridges, toner powder, OPC drums and refurbished printers.', cta: 'Shop Printer', href: '#/category/printer-accessories', icon: 'printer', img: 'images/products/printer.svg', c1: '#0a2a6e', c2: '#0f8fd6' }
  ];

  return { SHOP, GROUPS, CATEGORIES, PRODUCTS, BRANDS, SERVICES, SLIDES };
})();
