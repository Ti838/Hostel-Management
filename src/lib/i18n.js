// Internationalization support
export const LANGUAGES = {
  en: { name: 'English', flag: '🇺🇸' },
  bn: { name: 'বাংলা', flag: '🇧🇩' }
}

export const TRANSLATIONS = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    rooms: 'Room Management',
    residents: 'Residents',
    checkinout: 'Check In / Out',
    billing: 'Billing & Fees',
    meals: 'Meal Planner',
    complaints: 'Complaints',
    readmission: 'Readmission',
    notifications: 'Notifications',
    reports: 'Reports & Analytics',
    settings: 'Settings',
    auth: 'Authentication',

    // Common
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    loading: 'Loading...',
    no_data: 'No data available',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No',

    // Auth
    sign_in: 'Sign In',
    sign_up: 'Sign Up',
    sign_out: 'Sign Out',
    email: 'Email',
    password: 'Password',
    full_name: 'Full Name',
    forgot_password: 'Forgot Password?',
    create_account: 'Create Account',
    already_have_account: 'Already have an account?',
    dont_have_account: "Don't have an account?",

    // Dashboard
    welcome: 'Welcome',
    total_rooms: 'Total Rooms',
    active_residents: 'Active Residents',
    collected: 'Collected',
    overdue_bills: 'Overdue Bills',
    this_month: 'This month',
    available: 'available',

    // Settings
    hostel_info: 'Hostel Information',
    hostel_name: 'Hostel Name',
    warden_name: 'Warden Name',
    phone: 'Phone',
    address: 'Address',
    currency_symbol: 'Currency Symbol',
    fee_defaults: 'Fee Defaults',
    base_monthly_rent: 'Base Monthly Rent',
    readmission_fee: 'Readmission Fee',
    security_deposit: 'Security Deposit',
    late_fee_per_day: 'Late Fee / Day',
    due_day: 'Due Day of Month',
    map_location: 'Map & Location',
    google_maps_api_key: 'Google Maps API Key',
    customization: 'Customization',
    logo_url: 'Logo URL',
    welcome_message: 'Welcome Message',
    enable_meals: 'Enable Meal Planner',
    enable_complaints: 'Enable Complaints',
    enable_readmission: 'Enable Readmission',
    enable_notifications: 'Enable Notifications',
    enable_reports: 'Enable Reports',

    // Rooms
    room_number: 'Room Number',
    floor: 'Floor',
    type: 'Type',
    capacity: 'Capacity',
    monthly_rent: 'Monthly Rent',
    status: 'Status',
    amenities: 'Amenities',
    description: 'Description',

    // Residents
    resident_info: 'Resident Information',
    full_name: 'Full Name',
    phone: 'Phone',
    email: 'Email',
    nid: 'NID',
    date_of_birth: 'Date of Birth',
    gender: 'Gender',
    occupation: 'Occupation',
    emergency_contact: 'Emergency Contact',
    emergency_phone: 'Emergency Phone',
    photo_url: 'Photo URL',

    // Billing
    fee_type: 'Fee Type',
    amount: 'Amount',
    due_date: 'Due Date',
    paid_date: 'Paid Date',
    payment_method: 'Payment Method',
    transaction_ref: 'Transaction Ref',
    receipt_number: 'Receipt Number',
    user: 'User',
  },
  bn: {
    // Navigation
    dashboard: 'ড্যাশবোর্ড',
    rooms: 'রুম ম্যানেজমেন্ট',
    residents: 'রেসিডেন্টস',
    checkinout: 'চেক ইন / আউট',
    billing: 'বিলিং এবং ফি',
    meals: 'মিল প্ল্যানার',
    complaints: 'অভিযোগ',
    readmission: 'রিঅ্যাডমিশন',
    notifications: 'নোটিফিকেশন',
    reports: 'রিপোর্টস এবং অ্যানালিটিক্স',
    settings: 'সেটিংস',
    auth: 'অথেন্টিকেশন',

    // Common
    save: 'সেভ',
    cancel: 'ক্যানসেল',
    delete: 'ডিলিট',
    edit: 'এডিট',
    add: 'যোগ',
    search: 'খোঁজ',
    loading: 'লোড হচ্ছে...',
    no_data: 'কোন ডেটা নেই',
    confirm: 'কনফার্ম',
    yes: 'হ্যাঁ',
    no: 'না',

    // Auth
    sign_in: 'সাইন ইন',
    sign_up: 'সাইন আপ',
    sign_out: 'সাইন আউট',
    email: 'ইমেইল',
    password: 'পাসওয়ার্ড',
    full_name: 'পুরো নাম',
    forgot_password: 'পাসওয়ার্ড ভুলে গেছেন?',
    create_account: 'অ্যাকাউন্ট তৈরি করুন',
    already_have_account: 'ইতিমধ্যে অ্যাকাউন্ট আছে?',
    dont_have_account: 'অ্যাকাউন্ট নেই?',

    // Dashboard
    welcome: 'স্বাগতম',
    total_rooms: 'মোট রুম',
    active_residents: 'সক্রিয় রেসিডেন্ট',
    collected: 'সংগৃহীত',
    overdue_bills: 'বাকি বিল',
    this_month: 'এই মাসে',
    available: 'উপলব্ধ',

    // Settings
    hostel_info: 'হোস্টেল তথ্য',
    hostel_name: 'হোস্টেল নাম',
    warden_name: 'ওয়ার্ডেন নাম',
    phone: 'ফোন',
    address: 'ঠিকানা',
    currency_symbol: 'মুদ্রা প্রতীক',
    fee_defaults: 'ফি ডিফল্ট',
    base_monthly_rent: 'বেস মাসিক ভাড়া',
    readmission_fee: 'রিঅ্যাডমিশন ফি',
    security_deposit: 'সিকিউরিটি ডিপোজিট',
    late_fee_per_day: 'দেরি ফি / দিন',
    due_day: 'মাসের নির্ধারিত দিন',
    map_location: 'ম্যাপ এবং লোকেশন',
    google_maps_api_key: 'গুগল ম্যাপস API কী',
    customization: 'কাস্টমাইজেশন',
    logo_url: 'লোগো URL',
    welcome_message: 'স্বাগত বার্তা',
    enable_meals: 'মিল প্ল্যানার সক্ষম করুন',
    enable_complaints: 'অভিযোগ সক্ষম করুন',
    enable_readmission: 'রিঅ্যাডমিশন সক্ষম করুন',
    enable_notifications: 'নোটিফিকেশন সক্ষম করুন',
    enable_reports: 'রিপোর্টস সক্ষম করুন',

    // Rooms
    room_number: 'রুম নম্বর',
    floor: 'ফ্লোর',
    type: 'টাইপ',
    capacity: 'ক্যাপাসিটি',
    monthly_rent: 'মাসিক ভাড়া',
    status: 'স্ট্যাটাস',
    amenities: 'সুবিধা',
    description: 'বর্ণনা',

    // Residents
    resident_info: 'রেসিডেন্ট তথ্য',
    full_name: 'পুরো নাম',
    phone: 'ফোন',
    email: 'ইমেইল',
    nid: 'এনআইডি',
    date_of_birth: 'জন্ম তারিখ',
    gender: 'লিঙ্গ',
    occupation: 'পেশা',
    emergency_contact: 'জরুরি যোগাযোগ',
    emergency_phone: 'জরুরি ফোন',
    photo_url: 'ছবি URL',

    // Billing
    fee_type: 'ফি টাইপ',
    amount: 'পরিমাণ',
    due_date: 'নির্ধারিত তারিখ',
    paid_date: 'পরিশোধ তারিখ',
    payment_method: 'পেমেন্ট মেথড',
    transaction_ref: 'ট্রানজেকশন রেফ',
    receipt_number: 'রসিদ নম্বর',
    user: 'ব্যবহারকারী',
  }
}

export const useTranslation = (lang = 'en') => {
  const t = (key) => TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key] || key
  return { t, lang }
}