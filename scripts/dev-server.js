#!/usr/bin/env node
// Minimaler Dev-Loader — lädt .env und startet die Express-App.
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
require('../api/index.js');
