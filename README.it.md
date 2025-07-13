# TFS Time Report

[English](README.md) | [Italiano](README.it.md) | [Español](README.es.md)

## Panoramica del Progetto

TFS Time Report è una Progressive Web Application (PWA) progettata per semplificare il tracciamento delle ore di lavoro giornaliere. Permette agli utenti di registrare facilmente gli orari di entrata e di uscita, gestire le pause e generare report mensili in formato PDF, ottimizzando la gestione del tempo lavorativo.

## Funzionalità

*   Tracciamento intuitivo degli orari di entrata e uscita.
*   Gestione delle pause pranzo.
*   Generazione di report mensili delle ore di lavoro in formato PDF.
*   Opzione per aggiungere note personalizzate per ogni giorno (es. "riposo", "malattia", "ferie", "permesso").
*   Autenticazione sicura tramite Google.
*   Interfaccia utente responsive e adattabile ai dispositivi mobili.
*   Installabile come PWA sui dispositivi mobili.

## Tecnologie Utilizzate

*   **Frontend:** SvelteKit, Tailwind CSS
*   **Backend/Database:** Firebase (Authentication, Firestore)
*   **Generazione PDF:** jspdf, jspdf-autotable

## Installazione e Utilizzo

Segui questi passaggi per configurare ed eseguire l'applicazione sulla tua macchina locale.

### Prerequisiti

*   Node.js (versione LTS consigliata)
*   npm (Node Package Manager)

### Installazione

1.  **Clona il repository:**
    ```bash
    git clone https://github.com/Celes1125/tfs-time-report.git
    cd tfs-time-report
    ```

2.  **Installa le dipendenze:**
    ```bash
    npm install
    ```

3.  **Configurazione di Firebase:**
    Questa applicazione utilizza Firebase per l'autenticazione e l'archiviazione dei dati. Dovrai configurare il tuo progetto Firebase:
    *   Vai alla [Console di Firebase](https://console.firebase.google.com/).
    *   Crea un nuovo progetto.
    *   Abilita **Firestore Database** e **Autenticazione con Google** (in "Build" -> "Authentication" -> "Metodo di accesso").
    *   Una volta configurato il progetto, avrai bisogno dei dettagli di configurazione di Firebase. Nelle impostazioni del tuo progetto Firebase, vai a "Impostazioni progetto" -> "Generali" -> "Le tue app" e seleziona "App web". Copia l'oggetto di configurazione.
    *   Crea un nuovo file chiamato `.env.local` nella radice del tuo progetto (`tfs-time-report/`).
    *   Aggiungi la configurazione di Firebase a questo file, con il prefisso `VITE_`:
      ```env
      VITE_FIREBASE_API_KEY="tua_api_key"
      VITE_FIREBASE_AUTH_DOMAIN="tuo_auth_domain"
      VITE_FIREBASE_PROJECT_ID="tuo_project_id"
      VITE_FIREBASE_STORAGE_BUCKET="tuo_storage_bucket"
      VITE_FIREBASE_MESSAGING_SENDER_ID="tuo_messaging_sender_id"
      VITE_FIREBASE_APP_ID="tua_app_id"
      ```

    **Importante:** NON includere il file `.env.local` nel controllo di versione. È già presente nel file `.gitignore`.

### Esecuzione dell'Applicazione

1.  **Modalità di Sviluppo:**
    Per eseguire l'applicazione in modalità di sviluppo (con ricaricamento automatico):
    ```bash
    npm run dev
    ```
    L'applicazione sarà tipicamente disponibile all'indirizzo `http://localhost:5173`.

2.  **Build di Produzione:**
    Per creare una build dell'applicazione pronta per la produzione:
    ```bash
    npm run build
    ```
    I file statici verranno generati nella directory `build`.

## Screenshots

*   [Dashboard](docs/screenshots/dashboard.jpg)
*   ['Il mio report'](docs/screenshots/report.jpg)
*   ['Storico'](docs/screenshots/storico.jpg)
*   [PDF report demo](docs/demoPDFreport.pdf)

## Prueba la app
* Per valutare l'applicazione, si prega di utilizzare le seguenti credenziali dimostrative con il pulsante "Accedi con Google":
    Email: demo.user.apps.celes@gmail.com
    Password: *demo.user.apps.celes*

## Autore

*   **Celeste Colautti** - [Profilo GitHub](https://github.com/Celes1125) | [Profilo LinkedIn](https://www.linkedin.com/in/celestecolautti/)