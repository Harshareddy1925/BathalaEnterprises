document.addEventListener('DOMContentLoaded', () => {
    const track = document.querySelector('.properties-track');
    
    if (track) {
        // Duplicate the cards for a seamless loop
        const cards = Array.from(track.children);
        cards.forEach(card => {
            const clone = card.cloneNode(true);
            track.appendChild(clone);
        });
    }
});
