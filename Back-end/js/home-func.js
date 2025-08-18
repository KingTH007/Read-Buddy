 const elements = document.querySelectorAll('.animate-on-scroll');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                } else {
                    entry.target.classList.remove('fade-in'); // 👈 removes when out of view (so it can replay)
                }
            });
        }, { threshold: 0.2 });

        elements.forEach(el => observer.observe(el));