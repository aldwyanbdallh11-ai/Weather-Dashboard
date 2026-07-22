# 🌤️ Weather Dashboard

Weather Dashboard - لوحة طقس الطقس الاحترافية باستخدام OpenWeatherMap API

## ✨ المميزات

- 🌤️ **طقس فوري** - معلومات الطقس بالوقت اللحظة
- 📈 **نبؤاتات مفصلة** - تنبءات 5 أيام
- 🔆 **نظام المفضلة** - حفظ مدنك المفضلة
- 📍 **الجيولوكشن** - الثنائيات العامة فورية
- 🔄 **الذاكرة المؤقتة** - ربط 10 دقائق
- ☀️ **UV Index** - مفهرس الأشعاع فوق البنفسجية

## 🚀 البدء السريع

### المتطلبات
```bash
- Node.js (v14+)
- MongoDB
- OpenWeatherMap API Key
```

### التثبيت
```bash
npm install
cp .env.example .env
# أضف API Key إلى .env
npm start
```

### العمل على المطورّر
```bash
npm run dev
```

## 📀 إعداد API Key

1. اذهب إلى: https://openweathermap.org/api
2. سج�� حساب مجاني
3. انسخ API Key من الداشبورد
4. الصقها للملف `.env`

## 📀 API Endpoints

### الطقس
```
GET  /api/weather/city/:city          - طقس مدينة
GET  /api/weather/coords/:lat/:lon    - طقس الإحداثيات
GET  /api/weather/forecast/:city      - مؤشر 5 أيام
GET  /api/weather/all                 - إرجاع بياناته معاشة
```

### المفضلة
```
POST   /api/favorites              - إضافة مدينة مفضلة
GET    /api/favorites/:userId      - الحصول على المفضلة
DELETE /api/favorites/:id          - حذف من المفضلة
```

## 📋 مثال علمي

### الحصول على طقس مدينة
```bash
curl http://localhost:3001/api/weather/city/Cairo
```

### إضافة مدينة للمفضلة
```bash
curl -X POST http://localhost:3001/api/favorites \
  -H "Content-Type: application/json" \
  -d '{"userId": "user1", "cityName": "Cairo", "latitude": 30.04, "longitude": 31.23}'
```

## 💱 هيكل قاعدة البيانات

### Weather Model
```javascript
{
  city: String,
  country: String,
  temperature: Number,
  feelsLike: Number,
  humidity: Number,
  windSpeed: Number,
  description: String,
  uvIndex: Number,
  forecast: Array,
  lastUpdated: Date
}
```

### Favorite Model
```javascript
{
  userId: String,
  cityName: String,
  latitude: Number,
  longitude: Number,
  createdAt: Date
}
```

## 🛠️ متغيرات البيئة

```env
PORT                    - منفذ السيرفر (افتراضي: 3001)
MONGODB_URI             - رابط MongoDB
OPENWEATHER_API_KEY     - مفتاح OpenWeatherMap API
NODE_ENV                - بيئة التطوير
```

## 🚀 التطورات القادمة

- [ ] Web UI باستخدام React
- [ ] Mobile App
- [ ] المنبهات والتنبيهات
- [ ] رسومات بيانية
- [ ] مقرناته مدن متعددة

## 📚 الإرجاعات

- [OpenWeatherMap API](https://openweathermap.org/api)
- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Mongoose](https://mongoosejs.com/)

## 🛠️ الترخيص

MIT License

---

صُنع بـ ❤️ بواسطة فريق Weather Dashboard