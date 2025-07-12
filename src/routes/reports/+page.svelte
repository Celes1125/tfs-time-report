<script lang="ts">
  import { onMount } from 'svelte';
  import { auth, db } from '$lib/firebase';
  import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
  import { writable } from 'svelte/store';
  import jsPDF from 'jspdf';
  import autoTable from 'jspdf-autotable'; // Import autoTable

  const user = writable<any | null>(null);
  const savedReports = writable<Array<{ id: string; data: any }>>([]);
  const monthNames = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
  let hoveredReportId: string | null = null;

  onMount(() => {
    auth.onAuthStateChanged(async (currentUser) => {
      user.set(currentUser);
      if (currentUser) {
        const reportsCollectionRef = collection(db, `users/${currentUser.uid}/timeReports`);
        const querySnapshot = await getDocs(reportsCollectionRef);
        const fetchedReports: Array<{ id: string; data: any }> = [];
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        for (const docSnapshot of querySnapshot.docs) {
          const [year, month] = docSnapshot.id.split('-').map(Number);
          const reportDate = new Date(year, month - 1, 1); // Month is 0-indexed in Date object

          if (reportDate >= oneYearAgo) {
            fetchedReports.push({ id: docSnapshot.id, data: docSnapshot.data() });
          }
        }
        // Sort descending by year and then month
        fetchedReports.sort((a, b) => {
          const [yearA, monthA] = a.id.split('-').map(Number);
          const [yearB, monthB] = b.id.split('-').map(Number);
          if (yearA !== yearB) return yearB - yearA;
          return monthB - monthA;
        });
        savedReports.set(fetchedReports);
      }
    });
  });

  function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
  }

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

  async function downloadPDF(reportId: string, reportData: any) {
    const doc = new jsPDF();
    const [year, month] = reportId.split('-').map(Number);
    const monthName = monthNames[month - 1];
    const daysInMonth = getDaysInMonth(year, month - 1);

    // Set fonts and styles
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');

    // Header section
    doc.text('NOME COGNOME DIPENDENTE', 14, 22);
    doc.text('CLIENTE', 70, 22);
    doc.text('MESE', 120, 22);
    doc.text('SEDE DI LAVORO', 160, 22);

    doc.setFont('helvetica', 'normal');
    doc.text($user.displayName || '', 14, 28);
    // Assuming 'cliente' and 'sedeDiLavoro' are available from reportData or global scope
    // For now, using placeholders or global variables if they exist
    doc.text('Tweens for Service', 70, 28); // Placeholder for cliente
    doc.text(`${monthName} ${year}`, 120, 28);
    doc.text('Gemonio', 160, 28); // Placeholder for sedeDiLavoro

    doc.setFont('helvetica', 'bold');
    doc.text('AGENZIA', 14, 42);
    doc.text('TOTALE ORE MENSILI', 70, 42);

    doc.setFont('helvetica', 'normal');
    doc.text('Openjobmetis', 14, 48); // Placeholder for agenzia
    doc.text(calculateMonthlyTotalHours(reportData, daysInMonth), 70, 48);

    // Table section
    const tableColumn = ["Giorno", "Inizio", "Fine", "Tot. h. ord.", "Total h. str.", "Tot.", "Pausa pranzo", "Note"];
    const tableRows = [];

    for (let day = 1; day <= daysInMonth; day++) {
        const dayData = reportData[`day_${day}`] || {};
        const dailyTotal = calculateTotalHours(dayData.inizio, dayData.fine, dayData.pausaPranzo);
        const row = [
            day,
            dayData.inizio || '',
            dayData.fine || '',
            '', // Tot. h. ord.
            '', // Total h. str.
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

    doc.save(`time-report-${monthName}-${year}.pdf`);
  }

  
</script>

<h1 class="text-2xl font-bold mb-4 text-center">Storico</h1>

<div class="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
  {#if $user}
    {#if $savedReports.length > 0}
      <ul class="space-y-4">
        {#each $savedReports as report (report.id)}
          {@const [year, month] = report.id.split('-')}
          <li 
            class="flex flex-col sm:flex-row items-center justify-between p-3 border rounded-md cursor-pointer"
            on:mouseenter={() => hoveredReportId = report.id}
            on:mouseleave={() => hoveredReportId = null}
            on:focus={() => hoveredReportId = report.id}
            on:blur={() => hoveredReportId = null}
          >
            <a href={`/report?month=${month}&year=${year}`} class="text-blue-600 hover:underline flex-grow text-lg mb-2 sm:mb-0">
              Report di {monthNames[parseInt(month) - 1]} {year}
            </a>
            {#if hoveredReportId === report.id}
            <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
              <button on:click={() => downloadPDF(report.id, report.data)} class="bg-blue-500 text-white text-sm p-2 rounded-lg w-full">PDF</button>
            </div>
            {/if}
          </li>
        {/each}
      </ul>
    {:else}
      <p class="text-center text-lg">Ancora non ci sono dati da visualizzare</p>
    {/if}
  {:else}
    <p class="text-center text-red-500 text-lg">Per favore, <a href="/profile" class="underline">accedi</a> per visualizzare lo storico.</p>
  {/if}
</div>