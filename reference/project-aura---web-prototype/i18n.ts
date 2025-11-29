import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      common: {
        cancel: "Cancel",
        confirm: "Confirm",
        back: "Back",
        close: "Close",
        undo: "UNDO",
        submit: "Submit",
        save: "Save",
        apply: "Apply",
        loading: "Loading",
        error: "Error",
        success: "Success",
        km: "km",
        min: "min",
        mi: "mi"
      },
      nav: {
        home: "Home",
        activity: "Activity",
        location: "Location",
        profile: "Profile"
      },
      home: {
        where_to: "Where to?",
        welcome: "Welcome Back",
        request_ride: "Request Ride",
        select_dest: "Select Destination"
      },
      auth: {
        identity_verification: "Identity Verification",
        scan_face_id: "Scan Face ID",
        verifying: "Verifying Biometrics...",
        access_granted: "Access Granted",
        use_passcode: "Use Passcode Instead"
      },
      ride_select: {
        fleet: "Fleet",
        select_vehicle: "Select Vehicle",
        customize: "Customize",
        payment: "Payment",
        change: "Change",
        request: "REQUEST",
        away: "away"
      },
      active_ride: {
        connecting: "CONNECTING TO FLEET...",
        scanning: "Scanning...",
        confirmed: "DRIVER CONFIRMED",
        arriving: "ARRIVING NOW",
        en_route: "EN ROUTE",
        completed: "ARRIVED",
        reconnecting: "RECONNECTING...",
        driver_cancelled: "Driver Cancelled",
        driver_cancelled_desc: "We're sorry, the driver had to cancel. We are prioritizing a new ride for you now.",
        find_new: "Find New Ride",
        message: "Message",
        cancel_ride: "Cancel Ride?",
        cancel_fee_warning: "A cancellation fee of",
        cancel_fee_apply: "will apply.",
        free_cancel_time: "You can cancel for free within the next",
        keep_ride: "Keep Ride",
        confirm_cancel: "Confirm Cancellation",
        cancelling: "Cancelling Ride...",
        safety_hub: "Safety Hub"
      },
      receipt: {
        ride_complete: "Ride Complete",
        total_paid: "Total Paid",
        payment: "Payment",
        rate_trip: "Rate your trip",
        excellent: "Excellent!",
        good: "Good",
        how_was_it: "How was it?",
        submit_feedback: "Submit Feedback",
        add_tip: "Add a Tip",
        custom: "Custom",
        payment_confirmed: "Payment Confirmed"
      },
      profile: {
        rating: "Rating",
        rides: "Rides",
        prototype_controls: "Prototype Controls",
        driver_app: "Driver App",
        simulate_trip: "Simulate trip",
        admin: "Admin",
        analytics: "Analytics",
        saved_places: "Saved Places",
        preferences: "Preferences",
        quiet_mode: "Quiet Mode",
        payment_methods: "Payment Methods",
        log_out: "Log Out",
        language: "Language"
      },
      prefs: {
        cabin_control: "Cabin Control",
        customize_exp: "Customize your experience",
        temperature: "Temperature",
        lighting: "Mood Lighting",
        audio: "Audio Vibe",
        conversation: "Conversation",
        luggage: "Luggage Assistance",
        apply: "Apply Preferences",
        cool: "COOL",
        warm: "WARM",
        balanced: "BALANCED"
      },
      safety: {
        title: "Safety Hub",
        sos: "SOS",
        hold_to_call: "Hold 1s",
        desc: "Hold button for 1 second to contact local emergency services and notify safety contacts.",
        share_status: "Share Trip Status",
        share_desc: "Send live tracking to trusted contacts",
        toolkit: "Safety Toolkit",
        toolkit_desc: "Ride check, audio recording, and more",
        alert_triggered: "EMERGENCY ALERT TRIGGERED. Authorities Notified."
      },
      driver: {
        earnings: "Earnings",
        online: "Online",
        offline: "Offline",
        go_online: "GO",
        stop_requests: "Stop Requests",
        finding_trips: "Finding Trips...",
        high_demand: "You are in a high demand zone",
        accept: "Accept Ride",
        decline: "Decline",
        pickup: "Pickup",
        dropoff: "Dropoff",
        slide_arrive: "Slide to Arrive",
        slide_complete: "Slide to Complete",
        turn_right: "Turn Right"
      },
      admin: {
        overview: "Overview",
        live_fleet: "Live Fleet",
        recent_rides: "Recent Rides",
        view_all: "VIEW ALL"
      }
    }
  },
  bg: {
    translation: {
      common: {
        cancel: "Отказ",
        confirm: "Потвърди",
        back: "Назад",
        close: "Затвори",
        undo: "ОТМЕНИ",
        submit: "Изпрати",
        save: "Запази",
        apply: "Приложи",
        loading: "Зареждане",
        error: "Грешка",
        success: "Успех",
        km: "км",
        min: "мин",
        mi: "мили"
      },
      nav: {
        home: "Начало",
        activity: "Активност",
        location: "Локация",
        profile: "Профил"
      },
      home: {
        where_to: "Накъде?",
        welcome: "Добре дошли",
        request_ride: "Поръчай",
        select_dest: "Избери Дестинация"
      },
      auth: {
        identity_verification: "Проверка на самоличност",
        scan_face_id: "Сканиране на лице",
        verifying: "Проверка на биометрични данни...",
        access_granted: "Достъп Разрешен",
        use_passcode: "Използвай парола"
      },
      ride_select: {
        fleet: "Автопарк",
        select_vehicle: "Избери автомобил",
        customize: "Настройки",
        payment: "Плащане",
        change: "Промени",
        request: "ПОРЪЧАЙ",
        away: "наблизо"
      },
      active_ride: {
        connecting: "СВЪРЗВАНЕ С АВТОПАРКА...",
        scanning: "Сканиране...",
        confirmed: "ШОФЬОРЪТ ПОТВЪРДИ",
        arriving: "ПРИСТИГА",
        en_route: "НА ПЪТ",
        completed: "ПРИСТИГНА",
        reconnecting: "СВЪРЗВАНЕ...",
        driver_cancelled: "Шофьорът отказа",
        driver_cancelled_desc: "Съжаляваме, шофьорът трябваше да откаже. Търсим нов автомобил приоритетно.",
        find_new: "Намери нов превоз",
        message: "Съобщение",
        cancel_ride: "Отказ на пътуването?",
        cancel_fee_warning: "Такса за отказ от",
        cancel_fee_apply: "ще бъде начислена.",
        free_cancel_time: "Можете да се откажете безплатно в следващите",
        keep_ride: "Запази пътуването",
        confirm_cancel: "Потвърди отказа",
        cancelling: "Анулиране...",
        safety_hub: "Сигурност"
      },
      receipt: {
        ride_complete: "Пътуването приключи",
        total_paid: "Общо платено",
        payment: "Плащане",
        rate_trip: "Оценете пътуването",
        excellent: "Отлично!",
        good: "Добро",
        how_was_it: "Как беше?",
        submit_feedback: "Изпрати отзив",
        add_tip: "Добави бакшиш",
        custom: "Друга",
        payment_confirmed: "Плащането потвърдено"
      },
      profile: {
        rating: "Рейтинг",
        rides: "Пътувания",
        prototype_controls: "Прототип Контроли",
        driver_app: "Шофьор",
        simulate_trip: "Симулация",
        admin: "Админ",
        analytics: "Анализи",
        saved_places: "Запазени места",
        preferences: "Предпочитания",
        quiet_mode: "Тих режим",
        payment_methods: "Методи на плащане",
        log_out: "Изход",
        language: "Език"
      },
      prefs: {
        cabin_control: "Контрол на купето",
        customize_exp: "Персонализирай изживяването",
        temperature: "Температура",
        lighting: "Осветление",
        audio: "Аудио атмосфера",
        conversation: "Разговор",
        luggage: "Помощ с багаж",
        apply: "Приложи",
        cool: "ХЛАДНО",
        warm: "ТОПЛО",
        balanced: "БАЛАНС"
      },
      safety: {
        title: "Център за сигурност",
        sos: "SOS",
        hold_to_call: "Задръж 1с",
        desc: "Задръжте бутона за 1 секунда, за да се свържете с 112 и да уведомите контактите си.",
        share_status: "Сподели статус",
        share_desc: "Изпрати локация на близки",
        toolkit: "Инструменти",
        toolkit_desc: "Аудио запис и други",
        alert_triggered: "СПЕШЕН СИГНАЛ ИЗПРАТЕН. Властите са уведомени."
      },
      driver: {
        earnings: "Приходи",
        online: "На линия",
        offline: "Офлайн",
        go_online: "НА",
        stop_requests: "Спри заявки",
        finding_trips: "Търсене...",
        high_demand: "Вие сте в зона с висок интерес",
        accept: "Приеми",
        decline: "Откажи",
        pickup: "Взимане",
        dropoff: "Оставяне",
        slide_arrive: "Плъзни за пристигане",
        slide_complete: "Плъзни за край",
        turn_right: "Завийте надясно"
      },
      admin: {
        overview: "Общ преглед",
        live_fleet: "Автопарк",
        recent_rides: "Последни",
        view_all: "ВИЖ ВСИЧКИ"
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en", // default language
    fallbackLng: "en",
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;