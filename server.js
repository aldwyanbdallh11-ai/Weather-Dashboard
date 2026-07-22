/*
═══════════════════════════════════════════════════════════════
🌤️ WEATHER DASHBOARD - لوحة طقس الطقس الاحترافية
═══════════════════════════════════════════════════════════════

Weather API: OpenWeatherMap
Features: Real-time weather, Forecasts, Multiple cities
Tech: Node.js + Express + Axios + MongoDB

═══════════════════════════════════════════════════════════════
*/

const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// ═══════════════════════════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════════════════════════

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || 'your_api_key';
const OPENWEATHER_URL = 'https://api.openweathermap.org/data/2.5';

// ═══════════════════════════════════════════════════════════════
// DATABASE CONNECTION
// ═══════════════════════════════════════════════════════════════

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/weather-dashboard', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Error:', error.message);
  }
};

connectDB();

// ═══════════════════════════════════════════════════════════════
// DATABASE MODELS
// ═══════════════════════════════════════════════════════════════

const weatherSchema = new mongoose.Schema({
  city: { type: String, required: true, unique: true },
  country: String,
  latitude: Number,
  longitude: Number,
  temperature: Number,
  feelsLike: Number,
  humidity: Number,
  windSpeed: Number,
  pressure: Number,
  description: String,
  icon: String,
  sunrise: Date,
  sunset: Date,
  uvIndex: Number,
  visibility: Number,
  lastUpdated: { type: Date, default: Date.now },
  forecast: [{
    date: Date,
    temperature: Number,
    description: String,
    icon: String,
    humidity: Number,
    windSpeed: Number,
  }],
});

const favoriteSchema = new mongoose.Schema({
  userId: String,
  cityName: String,
  latitude: Number,
  longitude: Number,
  createdAt: { type: Date, default: Date.now },
});

const Weather = mongoose.model('Weather', weatherSchema);
const Favorite = mongoose.model('Favorite', favoriteSchema);

// ═══════════════════════════════════════════════════════════════
// WEATHER API FUNCTIONS
// ═══════════════════════════════════════════════════════════════

const fetchWeatherByCity = async (city) => {
  try {
    const response = await axios.get(`${OPENWEATHER_URL}/weather`, {
      params: {
        q: city,
        appid: OPENWEATHER_API_KEY,
        units: 'metric',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching weather:', error.message);
    throw error;
  }
};

const fetchForecast = async (city) => {
  try {
    const response = await axios.get(`${OPENWEATHER_URL}/forecast`, {
      params: {
        q: city,
        appid: OPENWEATHER_API_KEY,
        units: 'metric',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching forecast:', error.message);
    throw error;
  }
};

const fetchWeatherByCoords = async (lat, lon) => {
  try {
    const response = await axios.get(`${OPENWEATHER_URL}/weather`, {
      params: {
        lat,
        lon,
        appid: OPENWEATHER_API_KEY,
        units: 'metric',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching weather by coordinates:', error.message);
    throw error;
  }
};

const fetchUVIndex = async (lat, lon) => {
  try {
    const response = await axios.get(`${OPENWEATHER_URL}/uvi`, {
      params: {
        lat,
        lon,
        appid: OPENWEATHER_API_KEY,
      },
    });
    return response.data.value;
  } catch (error) {
    console.error('Error fetching UV index:', error.message);
    return null;
  }
};

// ═══════════════════════════════════════════════════════════════
// WEATHER ROUTES
// ═══════════════════════════════════════════════════════════════

app.get('/api/weather/city/:city', async (req, res) => {
  try {
    const { city } = req.params;
    
    let weatherData = await Weather.findOne({ city: { $regex: city, $options: 'i' } });
    
    if (weatherData && new Date() - weatherData.lastUpdated < 10 * 60 * 1000) {
      return res.json({ success: true, data: weatherData, cached: true });
    }

    const apiResponse = await fetchWeatherByCity(city);
    const forecast = await fetchForecast(city);
    const uvIndex = await fetchUVIndex(apiResponse.coord.lat, apiResponse.coord.lon);

    const forecastData = forecast.list
      .filter((item, index) => index % 8 === 0)
      .slice(0, 5)
      .map((item) => ({
        date: new Date(item.dt * 1000),
        temperature: item.main.temp,
        description: item.weather[0].description,
        icon: item.weather[0].icon,
        humidity: item.main.humidity,
        windSpeed: item.wind.speed,
      }));

    const weatherRecord = {
      city: apiResponse.name,
      country: apiResponse.sys.country,
      latitude: apiResponse.coord.lat,
      longitude: apiResponse.coord.lon,
      temperature: apiResponse.main.temp,
      feelsLike: apiResponse.main.feels_like,
      humidity: apiResponse.main.humidity,
      windSpeed: apiResponse.wind.speed,
      pressure: apiResponse.main.pressure,
      description: apiResponse.weather[0].description,
      icon: apiResponse.weather[0].icon,
      sunrise: new Date(apiResponse.sys.sunrise * 1000),
      sunset: new Date(apiResponse.sys.sunset * 1000),
      uvIndex: uvIndex,
      visibility: apiResponse.visibility,
      lastUpdated: new Date(),
      forecast: forecastData,
    };

    await Weather.findOneAndUpdate(
      { city: apiResponse.name },
      weatherRecord,
      { upsert: true, new: true }
    );

    res.json({ success: true, data: weatherRecord, cached: false });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/weather/coords/:lat/:lon', async (req, res) => {
  try {
    const { lat, lon } = req.params;
    const apiResponse = await fetchWeatherByCoords(lat, lon);
    const uvIndex = await fetchUVIndex(lat, lon);

    const weatherRecord = {
      city: apiResponse.name,
      country: apiResponse.sys.country,
      latitude: apiResponse.coord.lat,
      longitude: apiResponse.coord.lon,
      temperature: apiResponse.main.temp,
      feelsLike: apiResponse.main.feels_like,
      humidity: apiResponse.main.humidity,
      windSpeed: apiResponse.wind.speed,
      pressure: apiResponse.main.pressure,
      description: apiResponse.weather[0].description,
      icon: apiResponse.weather[0].icon,
      sunrise: new Date(apiResponse.sys.sunrise * 1000),
      sunset: new Date(apiResponse.sys.sunset * 1000),
      uvIndex: uvIndex,
      visibility: apiResponse.visibility,
      lastUpdated: new Date(),
    };

    res.json({ success: true, data: weatherRecord });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/weather/forecast/:city', async (req, res) => {
  try {
    const { city } = req.params;
    const forecast = await fetchForecast(city);

    const forecastData = forecast.list
      .filter((item, index) => index % 8 === 0)
      .map((item) => ({
        date: new Date(item.dt * 1000),
        temperature: item.main.temp,
        tempMin: item.main.temp_min,
        tempMax: item.main.temp_max,
        description: item.weather[0].description,
        icon: item.weather[0].icon,
        humidity: item.main.humidity,
        windSpeed: item.wind.speed,
        pressure: item.main.pressure,
      }));

    res.json({
      success: true,
      city: forecast.city.name,
      country: forecast.city.country,
      forecast: forecastData,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/weather/all', async (req, res) => {
  try {
    const allWeather = await Weather.find().sort({ lastUpdated: -1 });
    res.json({ success: true, data: allWeather });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// FAVORITES ROUTES
// ═══════════════════════════════════════════════════════════════

app.post('/api/favorites', async (req, res) => {
  try {
    const { userId, cityName, latitude, longitude } = req.body;

    if (!userId || !cityName) {
      return res.status(400).json({ success: false, error: 'userId and cityName required' });
    }

    const favorite = new Favorite({ userId, cityName, latitude, longitude });
    await favorite.save();
    
    res.status(201).json({
      success: true,
      message: 'تمت إضافة المدينة إلى المفضلة',
      data: favorite,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/favorites/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const favorites = await Favorite.find({ userId }).sort({ createdAt: -1 });
    res.json({ success: true, data: favorites });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/favorites/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Favorite.findByIdAndDelete(id);
    res.json({ success: true, message: 'تم حذف المدينة من المفضلة' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// HEALTH CHECK & ERROR HANDLERS
// ═══════════════════════════════════════════════════════════════

app.get('/api/health', (req, res) => {
  res.json({
    status: '✅ Weather Dashboard is running',
    timestamp: new Date(),
    version: '1.0.0',
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`
🌤️ Weather Dashboard running on port ${PORT}`);
  console.log(`💚 API: http://localhost:${PORT}/api`);
  console.log(`💑 Health Check: http://localhost:${PORT}/api/health\n`);
});

module.exports = app;