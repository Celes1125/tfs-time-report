# TFS Time Report

[English](README.md) | [Italiano](README.it.md) | [Español](README.es.md)

## Resumen del Proyecto

TFS Time Report es una Aplicación Web Progresiva (PWA) diseñada para simplificar el seguimiento diario de las horas de trabajo. Permite a los usuarios registrar fácilmente sus horas de entrada y salida, gestionar pausas y generar reportes mensuales en formato PDF, optimizando la gestión del tiempo laboral.

## Características

*   Seguimiento intuitivo de horas de entrada y salida.
*   Gestión de pausas para el almuerzo.
*   Generación de reportes mensuales de horas de trabajo en formato PDF.
*   Opción para añadir notas personalizadas para cada día (ej., "riposo", "malattia", "feria", "permesso").
*   Autenticación segura a través de Google.
*   Interfaz de usuario responsiva y adaptable a dispositivos móviles.
*   Instalable como PWA en dispositivos móviles.

## Tecnologías Utilizadas

*   **Frontend:** SvelteKit, Tailwind CSS
*   **Backend/Base de datos:** Firebase (Authentication, Firestore)
*   **Generación de PDF:** jspdf, jspdf-autotable

## Configuración y Uso

Sigue estos pasos para configurar y ejecutar la aplicación en tu máquina local.

### Prerrequisitos

*   Node.js (versión LTS recomendada)
*   npm (Node Package Manager)

### Instalación

1.  **Clona el repositorio:**
    ```bash
    git clone https://github.com/Celes1125/tfs-time-report.git
    cd tfs-time-report
    ```

2.  **Instala las dependencias:**
    ```bash
    npm install
    ```

3.  **Configuración de Firebase:**
    Esta aplicación utiliza Firebase para la autenticación y el almacenamiento de datos. Necesitarás configurar tu propio proyecto de Firebase:
    *   Ve a la [Consola de Firebase](https://console.firebase.google.com/).
    *   Crea un nuevo proyecto.
    *   Habilita **Firestore Database** y la **Autenticación con Google** (en "Build" -> "Authentication" -> "Método de inicio de sesión").
    *   Una vez configurado tu proyecto, necesitarás los detalles de configuración de Firebase. En los ajustes de tu proyecto, ve a "Configuración del proyecto" -> "General" -> "Tus apps" y selecciona "App web". Copia el objeto de configuración.
    *   Crea un nuevo archivo llamado `.env.local` en la raíz de tu proyecto (`tfs-time-report/`).
    *   Añade tu configuración de Firebase a este archivo, con el prefijo `VITE_`:
      ```env
      VITE_FIREBASE_API_KEY="tu_api_key"
      VITE_FIREBASE_AUTH_DOMAIN="tu_auth_domain"
      VITE_FIREBASE_PROJECT_ID="tu_project_id"
      VITE_FIREBASE_STORAGE_BUCKET="tu_storage_bucket"
      VITE_FIREBASE_MESSAGING_SENDER_ID="tu_messaging_sender_id"
      VITE_FIREBASE_APP_ID="tu_app_id"
      ```

    **Importante:** NO incluyas el archivo `.env.local` en tu control de versiones. Ya está incluido en el archivo `.gitignore`.

### Ejecución de la Aplicación

1.  **Modo de Desarrollo:**
    Para ejecutar la aplicación en modo de desarrollo (con recarga en caliente):
    ```bash
    npm run dev
    ```
    La aplicación estará disponible normalmente en `http://localhost:5173`.

2.  **Build de Producción:**
    Para crear una compilación de la aplicación lista para producción:
    ```bash
    npm run build
    ```
    Los archivos estáticos se generarán en el directorio `build`.

## Capturas de Pantalla

* `![Dashboard Screenshot](docs/screenshots/dashboard.png)`
* `![Il mio report Screenshot](docs/screenshots/report.png)` 
* `![Storico Screenshot](docs/screenshots/storico.png)`   
* `[Il mio report pdf](docs/demoPDFreport.pdf)` 

## Autor

*   **Celeste Colautti** - [Perfil de GitHub](https://github.com/Celes1125) | [Perfil de LinkedIn](https://www.linkedin.com/in/celestecolautti/)