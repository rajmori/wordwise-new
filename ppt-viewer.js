// PPT Viewer - Display PowerPoint from GCP Bucket
// Using Google Drive viewer for PPTX files (view-only, no download)

class PPTViewer {
    constructor() {
        this.modal = document.getElementById('pptModal');
        this.openBtn = document.getElementById('openPptBtn');
        this.closeBtn = document.getElementById('closePptBtn');
        this.slideContainer = document.getElementById('pptSlide');

        // PPTX file from GCP bucket
        this.pptxUrl = 'https://storage.googleapis.com/intro12/intro/A-1_Etymology_and_Tricks_with_Styled_Meanings.pptx';

        this.init();
    }

    init() {
        if (!this.openBtn || !this.modal) return;

        // Open modal
        this.openBtn.addEventListener('click', () => this.openModal());

        // Close modal
        this.closeBtn.addEventListener('click', () => this.closeModal());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                this.closeModal();
            }
        });
    }

    openModal() {
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        this.loadPresentation();
    }

    closeModal() {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
        // Clear iframe to stop loading
        this.slideContainer.innerHTML = '';
    }

    loadPresentation() {
        // Use Google Drive viewer to display PPTX
        // This provides view-only access without download option
        const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(this.pptxUrl)}&embedded=true`;

        this.slideContainer.innerHTML = `
      <div class="ppt-iframe-container">
        <iframe 
          src="${viewerUrl}"
          class="ppt-iframe"
          frameborder="0"
          allowfullscreen
        ></iframe>
        <div class="ppt-loading">
          <div class="loading-spinner"></div>
          <p>Loading presentation...</p>
        </div>
      </div>
    `;

        // Hide loading indicator when iframe loads
        const iframe = this.slideContainer.querySelector('.ppt-iframe');
        const loading = this.slideContainer.querySelector('.ppt-loading');

        iframe.addEventListener('load', () => {
            if (loading) {
                loading.style.display = 'none';
            }
        });

        // Prevent right-click on container
        this.slideContainer.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            return false;
        });
    }
}

// Initialize PPT Viewer when DOM is ready
export function initPPTViewer() {
    new PPTViewer();
}
