<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { auth, db } from '../../lib/firebase';
  import { doc, getDoc, setDoc } from 'firebase/firestore';
  import { writable } from 'svelte/store';
  import jsPDF from 'jspdf';
  import autoTable from 'jspdf-autotable';

  const user = writable<any | null>(null);
  const reportData = writable<any>({});
  const monthNames = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
  
  let currentYear: number;
  let currentMonthIndex: number;
  let currentMonthName: string;
  let sedeDiLavoro = 'Gemonio';
  let nomeCognome = '';
  let cliente = 'Tweens for Service'; // Default value for Cliente
  let agenzia = 'Openjobmetis';

  page.subscribe(p => {
    const yearParam = p.url.searchParams.get('year');
    const monthParam = p.url.searchParams.get('month');
    const d = new Date();
    currentYear = yearParam ? parseInt(yearParam) : d.getFullYear();
    currentMonthIndex = monthParam ? parseInt(monthParam) - 1 : d.getMonth();
    currentMonthName = monthNames[currentMonthIndex];
  });

  onMount(() => {
    console.log("report/+page.svelte: Page mounted.");
    auth.onAuthStateChanged(async (currentUser) => {
      user.set(currentUser);
      if (currentUser) {
        nomeCognome = currentUser.displayName || '';
        await fetchReportData(currentUser.uid);
      }
    });
  });

  async function fetchReportData(uid: string) {
    const monthString = (currentMonthIndex + 1).toString().padStart(2, '0');
    const currentMonthYear = `${currentYear}-${monthString}`;
    const docRef = doc(db, `users/${uid}/timeReports`, currentMonthYear);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      reportData.set(docSnap.data());
    } else {
      reportData.set({});
    }
  }

  async function updateReportData(uid: string, day: number, field: string, value: any) {
    const monthString = (currentMonthIndex + 1).toString().padStart(2, '0');
    const currentMonthYear = `${currentYear}-${monthString}`;
    const docRef = doc(db, `users/${uid}/timeReports`, currentMonthYear);
    const dayKey = `day_${day}`;
    const updatedField = { [dayKey]: { ...($reportData[dayKey] || {}), [field]: value } };

    await setDoc(docRef, updatedField, { merge: true });
    reportData.update(currentData => ({...currentData, ...updatedField}));
  }

  function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
  }

  const daysInCurrentMonth = getDaysInMonth(currentYear, currentMonthIndex);

  function calculateTotalHours(inizio: string | undefined, fine: string | undefined, pausaPranzo: number | undefined): string {
    if (inizio && fine) {
      const [startH, startM] = inizio.split(':').map(Number);
      const [endH, endM] = fine.split(':').map(Number);
      let dailyMinutes = (endH * 60 + endM) - (startH * 60 + startM) - (pausaPranzo || 0);
      if (dailyMinutes < 0) dailyMinutes = 0;
      
      const totalHours = Math.floor(dailyMinutes / 60);
      const totalMinutes = dailyMinutes % 60;
      return `${totalHours}:${totalMinutes.toString().padStart(2, '0')}`;
    }
    return '';
  }

  function calculateMonthlyTotalHours(reportData: any, daysInMonth: number): string {
    let totalMonthlyMinutes = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const dayData = reportData[`day_${day}`] || {};
      const inizio = dayData.inizio || '';
      const fine = dayData.fine || '';
      const pausaPranzo = dayData.pausaPranzo || 0;

      if (inizio && fine) {
        const [startH, startM] = inizio.split(':').map(Number);
        const [endH, endM] = fine.split(':').map(Number);
        let dailyMinutes = (endH * 60 + endM) - (startH * 60 + startM) - (pausaPranzo || 0);
        if (dailyMinutes < 0) dailyMinutes = 0;
        totalMonthlyMinutes += dailyMinutes;
      }
    }

    const totalHours = Math.floor(totalMonthlyMinutes / 60);
    const totalMinutes = totalMonthlyMinutes % 60;

    return `${totalHours}:${totalMinutes.toString().padStart(2, '0')}`;
  }

  async function downloadPDF() {
    const doc = new jsPDF();

    // Set fonts and styles
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');

    // Header section
    doc.text('NOME COGNOME DIPENDENTE', 14, 22);
    doc.text('CLIENTE', 70, 22);
    doc.text('MESE', 120, 22);
    doc.text('SEDE DI LAVORO', 160, 22);

    doc.setFont('helvetica', 'normal');
    doc.text(nomeCognome, 14, 28);
    doc.text(cliente, 70, 28);
    doc.text(`${currentMonthName} ${currentYear}`, 120, 28);
    doc.text(sedeDiLavoro, 160, 28);

    doc.setFont('helvetica', 'bold');
    doc.text('AGENZIA', 14, 42);
    doc.text('TOTALE ORE MENSILI', 70, 42);

    doc.setFont('helvetica', 'normal');
    doc.text(agenzia, 14, 48);
    doc.text(calculateMonthlyTotalHours($reportData, daysInCurrentMonth), 70, 48);

    // Table section
    const tableColumn = ["Giorno", "Inizio", "Fine", "Tot. h. ord.", "Total h. str.", "Tot.", "Pausa pranzo", "Note"];
    const tableRows = [];

    for (let day = 1; day <= daysInCurrentMonth; day++) {
        const dayData = $reportData[`day_${day}`] || {};
        const dailyTotal = calculateTotalHours(dayData.inizio, dayData.fine, dayData.pausaPranzo);
        const row = [
            day,
            dayData.inizio || '',
            dayData.fine || '',
            '',
            '',
            dailyTotal,
            dayData.pausaPranzo || '',
            dayData.note || ''
        ];
        tableRows.push(row);
    }

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 60,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 1.5, halign: 'center' },
        headStyles: { fillColor: [220, 220, 220], textColor: 20, fontStyle: 'bold' },
        didDrawPage: (data) => {
            // Footer
            const finalY = data.cursor.y;
            doc.setFontSize(10);
            doc.text('Firma del lavoratore', 14, finalY + 20);
            doc.line(14, finalY + 22, 80, finalY + 22);

            doc.text('Firma del responsabile d’azienda', 110, finalY + 20);
            doc.line(110, finalY + 22, 180, finalY + 22);
        }
    });

    doc.save(`time-report-${currentMonthName}-${currentYear}.pdf`);
  }

  let showNoteModal = false;
  let currentDayForNote: number | null = null;
  let currentNoteValue: string = '';
  const predefinedNotes = ["riposo", "malattia", "feria", "permesso"];

  function openNoteModal(day: number, note: string) {
    currentDayForNote = day;
    currentNoteValue = note;
    showNoteModal = true;
  }

  async function saveNote() {
    if ($user && currentDayForNote !== null) {
      await updateReportData($user.uid, currentDayForNote, 'note', currentNoteValue);
      closeNoteModal();
    }
  }

  function closeNoteModal() {
    showNoteModal = false;
    currentDayForNote = null;
    currentNoteValue = '';
  }

  function selectPredefinedNote(note: string) {
    currentNoteValue = note;
    saveNote(); // Save immediately when a predefined note is selected
  }

  
</script>

<div class="container mx-auto p-4 bg-white max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl">
  <div class="border-2 border-black p-4" id="report-content">
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
      <div>
        <label for="nome-cognome" class="block text-sm font-bold">NOME COGNOME DIPENDENTE</label>
        <input type="text" id="nome-cognome" bind:value={nomeCognome} class="border-b-2 border-black w-full p-1">
      </div>
      <div>
        <label for="cliente" class="block text-sm font-bold">CLIENTE</label>
        <input type="text" id="cliente" bind:value={cliente} class="border-b-2 border-black w-full p-1">
      </div>
      <div>
        <label for="mese" class="block text-sm font-bold">MESE</label>
        <input type="text" id="mese" value="{currentMonthName} {currentYear}" class="border-b-2 border-black w-full p-1" readonly>
      </div>
      <div>
        <label for="sede" class="block text-sm font-bold">SEDE DI LAVORO</label>
        <input type="text" id="sede" bind:value={sedeDiLavoro} class="border-b-2 border-black w-full p-1">
      </div>
      <div>
        <label for="agenzia" class="block text-sm font-bold">AGENZIA</label>
        <input type="text" id="agenzia" bind:value={agenzia} class="border-b-2 border-black w-full p-1">
      </div>
      <div>
        <label for="total-ore-mensili" class="block text-sm font-bold">TOTALE ORE MENSILI</label>
        <div id="total-ore-mensili" class="border-b-2 border-black w-full p-1">{calculateMonthlyTotalHours($reportData, daysInCurrentMonth)}</div>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full border-collapse border-2 border-black mb-4 text-sm">
        <thead>
          <tr class="bg-gray-200">
            <th class="border-2 border-black p-1 text-center w-16">Giorno</th>
            <th class="border-2 border-black p-1 text-center w-28">Inizio</th>
            <th class="border-2 border-black p-1 text-center w-28">Fine</th>
            <th class="border-2 border-black p-1 text-center w-28">Tot. h. ord.</th>
            <th class="border-2 border-black p-1 text-center w-28">Total h. str.</th>
            <th class="border-2 border-black p-1 text-center w-28">Tot.</th>
            <th class="border-2 border-black p-1 text-center w-24">Pausa pranzo</th>
            <th class="border-2 border-black p-1 text-center w-64">Note</th>
          </tr>
        </thead>
        <tbody>
          {#each Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1) as day}
            {@const dayData = $reportData[`day_${day}`] || {}}
            <tr>
              <td class="border-2 border-black p-1 text-center">{day}</td>
              <td class="border-2 border-black p-1">
                <input 
                  type="time" 
                  class="w-full text-center p-2 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={dayData.inizio || ''} 
                  on:change={(e) => updateReportData($user.uid, day, 'inizio', e.target.value)}
                  min="00:00" 
                  max="23:59"
                >
              </td>
              <td class="border-2 border-black p-1">
                <input 
                  type="time" 
                  class="w-full text-center p-2 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={dayData.fine || ''} 
                  on:change={(e) => updateReportData($user.uid, day, 'fine', e.target.value)}
                  min="00:00" 
                  max="23:59"
                >
              </td>
              <td class="border-2 border-black p-1"></td>
              <td class="border-2 border-black p-1"></td>
              <td class="border-2 border-black p-1 text-center">{calculateTotalHours(dayData.inizio, dayData.fine, dayData.pausaPranzo)}</td>
              <td class="border-2 border-black p-1">
                <input 
                  type="number" 
                  class="w-full text-center p-2 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={dayData.pausaPranzo || ''} 
                  on:change={(e) => updateReportData($user.uid, day, 'pausaPranzo', parseInt(e.target.value))}
                  min="0"
                >
              </td>
              <td class="border-2 border-black p-1">
                <button 
                  type="button"
                  class="w-full text-center p-2 text-base cursor-pointer hover:bg-gray-100"
                  on:click={() => openNoteModal(day, dayData.note || '')}
                  aria-haspopup="dialog"
                  aria-expanded={showNoteModal}
                >
                  {dayData.note || ''}
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <div class="flex flex-col sm:flex-row justify-between mb-4 space-y-4 sm:space-y-0">
        <div class="w-full sm:w-1/2 pr-2">
            <p class="text-sm">Firma del lavoratore</p>
            <div class="border-b-2 border-black w-full mt-4 h-8"></div>
        </div>
        <div class="w-full sm:w-1/2 pl-2">
            <p class="text-sm">Firma del responsabile d’azienda</p>
            <div class="border-b-2 border-black w-full mt-4 h-8"></div>
        </div>
    </div>
  </div>

  <div class="mt-4 flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
    <button on:click={downloadPDF} class="bg-blue-500 text-white p-3 rounded-lg w-full sm:w-auto text-lg">Scarica PDF</button>
  </div>
</div>

{#if showNoteModal}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
    <div class="bg-white p-8 rounded-lg shadow-xl max-w-md w-full m-4">
      <h2 class="text-xl font-bold mb-4 text-center">Modifica Nota per el Giorno {currentDayForNote}</h2>
      
      <div class="mb-4">
        <label for="note-input" class="block text-gray-700 text-sm font-bold mb-2">Seleziona o digita una nota:</label>
        <div class="grid grid-cols-2 gap-2 mb-4">
          {#each predefinedNotes as note}
            <button 
              on:click={() => selectPredefinedNote(note)} 
              class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg text-sm"
            >
              {note}
            </button>
          {/each}
        </div>
        <input
          type="text"
          id="note-input"
          bind:value={currentNoteValue}
          class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          placeholder="Digita la tua nota..."
        >
      </div>

      <div class="flex justify-end space-x-4">
        <button 
          on:click={closeNoteModal} 
          class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline"
        >
          Annulla
        </button>
        <button 
          on:click={saveNote} 
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline"
        >
          Salva
        </button>
      </div>
    </div>
  </div>
{/if}
