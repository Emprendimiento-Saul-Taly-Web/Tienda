// Configuración de la Firebase Principal
const firebaseConfig = {
    apiKey: "AIzaSyAwdXNniflYWXCGxJPCbBlFMr8NB09XgRY",
    authDomain: "web-emprendimiento-saul-taly.firebaseapp.com",
    databaseURL: "https://web-emprendimiento-saul-taly-default-rtdb.firebaseio.com",
    projectId: "web-emprendimiento-saul-taly",
    storageBucket: "web-emprendimiento-saul-taly.firebasestorage.app",
    messagingSenderId: "1074941413246",
    appId: "1:1074941413246:web:b943421f8e08c8b696152f"
};

// 1. Inicializar Firebase Principal PRIMERO
firebase.initializeApp(firebaseConfig);

// 2. Crear las referencias globales
var db = firebase.database();
var auth = firebase.auth();
var googleProvider = new firebase.auth.GoogleAuthProvider();

let currentConfig = {}, currentItems = [], cart = {}, slideIndex = 0, holdTimer, autoSlide, fsInterval, currentFsIndex = 0;


// Configuración de la segunda Firebase (Insumos)
const insumosConfig = {
    apiKey: "AIzaSyD2XJbKggN2vNQP2qXBg7d32m_3QJB0h4w",
    authDomain: "emprendimientosaultaly-f3291.firebaseapp.com",
    databaseURL: "https://emprendimientosaultaly-f3291-default-rtdb.firebaseio.com",
    projectId: "emprendimientosaultaly-f3291",
    storageBucket: "emprendimientosaultaly-f3291.firebasestorage.app",
    messagingSenderId: "421827246124",
    appId: "1:421827246124:web:9d8c71a07b2728a8263989",
    measurementId: "G-6YDZ4JSQDM"
};

// Inicialización de la segunda app
const appInsumos = firebase.initializeApp(insumosConfig, "appInsumos");
const dbInsumos = appInsumos.database();