<script lang="ts">
  import { auth, db } from '$lib/firebase';
  import { doc, setDoc, getDoc } from 'firebase/firestore';
  import { writable } from 'svelte/store';
  import { onMount } from 'svelte';
  import { GoogleAuthProvider, signInWithRedirect, signOut, onAuthStateChanged, getRedirectResult } from 'firebase/auth'; // Added auth imports

  const user = writable<any | null>(null);
  const dailyEntries = writable<any>({});
  const currentDate = new Date();
  const currentDay = currentDate.getDate();
  const currentMonthYear = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;

  // Authentication functions
  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider);
  }

  async function handleSignOut() {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
      alert("Error al cerrar sesión."); // Provide user feedback
    }
  }

  onMount(() => {
    onAuthStateChanged(auth, async (currentUser) => {
      user.set(currentUser);
      if (currentUser) {
        await fetchDailyEntries(currentUser.uid);
      }
    });

    getRedirectResult(auth)
      .catch((err) => {
        console.error("Error en el resultado de la redirección:", err);
        // Handle error, e.g., display a message to the user
      });
  });

  async function fetchDailyEntries(uid: string) {
    const docRef = doc(db, `users/${uid}/timeReports`, currentMonthYear);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      dailyEntries.set(docSnap.data());
    } else {
      dailyEntries.set({});
    }
  }

  async function updateDailyEntry(uid: string, data: any) {
    const docRef = doc(db, `users/${uid}/timeReports`, currentMonthYear);
    await setDoc(docRef, data, { merge: true });
    dailyEntries.update(currentEntries => ({ ...currentEntries, ...data }));
  }

  function formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  function timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  function addMinutesToTime(timeStr: string, minutesToAdd: number): string {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + minutesToAdd;

    const newHours = Math.floor(totalMinutes / 60);
    const newMinutes = totalMinutes % 60;

    return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
  }

  let showSuccessMessage = false; // State variable for success message

  async function markTime(type: 'inizio') {
    const currentUser = $user;
    if (!currentUser) {
      alert("Por favor, inicia sesión para registrar tu jornada.");
      return;
    }

    let timeToRecord = formatTime(new Date()); // Default to exact time
    let calculatedFineTime = '';
    let defaultPausaPranzo = 30; // Default pause is 30 minutes

    if (type === 'inizio') {
      const predefinedTimes = ['04:00', '05:00', '06:00', '07:30'];
      const currentTime = new Date();
      const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

      let closestTime = '';
      let minDifference = Infinity;

      for (const predefinedTimeStr of predefinedTimes) {
        const predefinedMinutes = timeToMinutes(predefinedTimeStr);
        const difference = Math.abs(currentMinutes - predefinedMinutes);

        if (difference < minDifference) {
          minDifference = difference;
          closestTime = predefinedTimeStr;
        }
      }
      timeToRecord = closestTime;

      // Calculate Fine time: Inizio + 8 hours + Pausa (30 minutes)
      calculatedFineTime = addMinutesToTime(timeToRecord, 8 * 60 + defaultPausaPranzo);
    }

    const currentDayEntry = $dailyEntries[`day_${currentDay}`] || {};

    await updateDailyEntry(currentUser.uid, {
      [`day_${currentDay}`]: { 
        ...currentDayEntry, 
        inizio: timeToRecord,
        fine: calculatedFineTime,
        pausaPranzo: defaultPausaPranzo // Automatically set pause to 30 minutes
      }
    });

    showSuccessMessage = true; // Show success message
    setTimeout(() => showSuccessMessage = false, 3000); // Hide after 3 seconds
  }

  $: currentDayData = $dailyEntries[`day_${currentDay}`] || {};
</script>

<h1 class="text-2xl font-bold mb-4 text-center">Dashboard</h1>

{#if !$user}
  <div class="bg-white p-6 rounded-lg shadow-md text-center max-w-md mx-auto">
    <p class="mb-4">Per favore, accedi per registrare la tua giornata.</p>
    <button on:click={signInWithGoogle} class="bg-blue-500 text-white p-3 rounded-lg w-full text-lg">Accedi con Google</button>
  </div>
{:else}
  <div class="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
    <p class="mb-2 text-lg">Benvenuto, {$user.displayName}!</p>
    <button on:click={handleSignOut} class="bg-red-500 text-white p-3 rounded-lg mb-4 w-full text-lg">Esci</button>

    <div class="mb-4 text-center">
      <p class="text-xl font-semibold">Data attuale: {currentDate.toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      <p class="text-lg">Giorno: {currentDay}</p>
    </div>

    <div class="mb-4 text-center">
      <p class="text-lg"><strong>Inizio:</strong> {currentDayData.inizio || '--:--'}</p>
      <p class="text-lg"><strong>Fine:</strong> {currentDayData.fine || '--:--'}</p>
      <p class="text-lg"><strong>Pausa Pranzo:</strong> {currentDayData.pausaPranzo ? `${currentDayData.pausaPranzo} minuti` : '--'}</p>
    </div>

    <button on:click={() => markTime('inizio')} class="mt-4 bg-blue-500 text-white p-3 rounded-lg w-full text-xl" disabled={!!currentDayData.inizio}>Timbra Inizio</button>

    {#if showSuccessMessage}
      <div class="mt-4 p-3 bg-green-100 text-green-800 rounded-lg text-center text-lg">
        Fatto! Hai timbrato. Buon lavoro!
      </div>
    {/if}
  </div>
{/if}