<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  let startX = 0;
  let endX = 0;
  const threshold = 50; // Minimum distance for a swipe to be registered

  const pages = ['/', '/report', '/reports'];
  const currentPageIndex = $derived(() => {
    const currentPath = $page.url.pathname;
    let index = pages.indexOf(currentPath);
    if (index === -1) {
      index = 0; // Fallback if the current path is not in our defined pages
    }
    return index;
  });

  function handleTouchStart(event: TouchEvent) {
    startX = event.touches[0].clientX;
  }

  function handleTouchMove(event: TouchEvent) {
    endX = event.touches[0].clientX;
  }

  function handleTouchEnd() {
    const diffX = startX - endX;

    if (Math.abs(diffX) > threshold) {
      if (diffX > 0) { // Swiped left (move to next page)
        if (currentPageIndex < pages.length - 1) {
          goto(pages[currentPageIndex + 1]);
        }
      } else { // Swiped right (move to previous page)
        if (currentPageIndex > 0) {
          goto(pages[currentPageIndex - 1]);
        }
      }
    }
    // Reset for next swipe
    startX = 0;
    endX = 0;
  }
</script>

<div
  class="flex flex-col min-h-screen overflow-hidden"
  ontouchstart={handleTouchStart}
  ontouchmove={handleTouchMove}
  ontouchend={handleTouchEnd}
>
  <main class="flex-grow p-4 w-full">
    <slot />
  </main>

  
</div>

<style>
  /* Optional: Add smooth transitions for page changes if desired */
  /* You might need to adjust this based on how SvelteKit handles page transitions */
</style>