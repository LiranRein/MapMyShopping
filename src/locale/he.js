export const he = {
  appName: 'MapMyShopping',
  home: {
    title: 'הרשימה של הבית',
    actions: {
      search: 'חיפוש',
      settings: 'הגדרות',
    },
    hero: {
      label: 'סיכום הרשימה',
      ringAria: (collected, total) => `${collected} מתוך ${total} נאספו`,
      ringCaption: 'נאספו',
      nextShop: 'הקנייה הבאה',
      items: (count) => `${count} פריטים`,
      areas: (count) => `ב-${count} אזורים`,
      remaining: (count) => `${count} נותרו לאסוף`,
      synced: 'מסונכרן עם כל הבית',
      cta: 'יוצאים לקנות',
    },
    route: {
      title: 'המסלול בחנות',
      edit: 'עריכת סדר',
      done: 'הושלם',
    },
    shortcuts: {
      title: 'קיצורים',
      voice: 'הוספה קולית',
      favorites: 'מועדפים',
      catalog: 'קטלוג',
    },
  },
  nav: {
    label: 'ניווט ראשי',
    home: 'בית',
    list: 'רשימה',
    add: 'הוספת פריט',
    favorites: 'מועדפים',
    household: 'הבית שלי',
  },
};
