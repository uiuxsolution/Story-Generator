// You'll need to replace 'YOUR_API_KEY' with your actual Gemini API key
const API_KEY = 'AIzaSyBwXERiaw9xtDdUfNSfmjNmtHgtnox4Lbw';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + API_KEY;

let selectedGenre = '';
let selectedStyle = '';

// Initialize event listeners
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    initializeButtons();
    setupGenerateButton();
    setupCopyButton();
    setupDownloadButton();
    setupSaveButton();
    setupStoryLength();
    loadSavedStories();
    setupShareButtons();
    initializeLanguage();
    initializeTemplates();
    initializePromptSuggestions();
    initializeRating();
    initializeSpeech();
});

// Theme Switcher
function initializeTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggle.checked = savedTheme === 'dark';

    themeToggle.addEventListener('change', (e) => {
        const theme = e.target.checked ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    });
}

function initializeButtons() {
    // Genre button listeners
    document.querySelectorAll('.genre-btn').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.genre-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            selectedGenre = button.dataset.genre;
        });
    });

    // Style button listeners
    document.querySelectorAll('.style-btn').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.style-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            selectedStyle = button.dataset.style;
        });
    });
}

function setupGenerateButton() {
    const generateBtn = document.getElementById('generate-btn');
    generateBtn.addEventListener('click', generateStory);
}

async function generateStory() {
    const prompt = document.getElementById('prompt').value;
    const storyContent = document.getElementById('story-content');
    const storyLength = document.getElementById('story-length').value;
    
    if (!prompt || !selectedGenre || !selectedStyle) {
        alert('Please fill in all required fields!');
        return;
    }

    storyContent.textContent = 'Generating your story...';
    document.getElementById('generate-btn').disabled = true;

    try {
        const fullPrompt = `Generate a ${selectedStyle} story in the ${selectedGenre} genre based on the following prompt: ${prompt}. Make it approximately ${storyLength} words long. Make it engaging and creative.`;
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: fullPrompt
                    }]
                }]
            })
        });

        const responseData = await response.json();
        
        if (!response.ok) {
            console.error('API Error:', responseData);
            throw new Error(`API Error: ${JSON.stringify(responseData)}`);
        }

        if (!responseData.candidates || !responseData.candidates[0]?.content?.parts?.[0]?.text) {
            console.error('Unexpected API response:', responseData);
            throw new Error('Invalid API response format');
        }

        const generatedStory = responseData.candidates[0].content.parts[0].text;
        
        // Generate title and update content
        const title = await generateTitle(generatedStory);
        document.getElementById('story-title').textContent = title;
        storyContent.textContent = generatedStory;
        
        // Update stats
        updateStoryStats(generatedStory);
    } catch (error) {
        console.error('Detailed Error:', error);
        storyContent.textContent = `Error: ${error.message}. Please try again.`;
    } finally {
        document.getElementById('generate-btn').disabled = false;
    }
}

function setupCopyButton() {
    const copyBtn = document.getElementById('copy-btn');
    copyBtn.addEventListener('click', () => {
        const storyContent = document.getElementById('story-content').textContent;
        navigator.clipboard.writeText(storyContent)
            .then(() => alert('Story copied to clipboard!'))
            .catch(err => console.error('Failed to copy:', err));
    });
}

function setupDownloadButton() {
    const downloadBtn = document.getElementById('download-btn');
    downloadBtn.addEventListener('click', () => {
        const storyContent = document.getElementById('story-content').textContent;
        const blob = new Blob([storyContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'generated-story.txt';
        a.click();
        window.URL.revokeObjectURL(url);
    });
}

// Story Length Control
function setupStoryLength() {
    const lengthSlider = document.getElementById('story-length');
    const lengthValue = document.getElementById('length-value');

    lengthSlider.addEventListener('input', () => {
        lengthValue.textContent = `${lengthSlider.value} words`;
    });
}

// Generate AI Title
async function generateTitle(storyContent) {
    try {
        const titlePrompt = `Generate a creative and catchy title for this story: ${storyContent.substring(0, 200)}...`;
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: titlePrompt
                    }]
                }]
            })
        });

        if (!response.ok) throw new Error('Failed to generate title');
        
        const data = await response.json();
        return data.candidates[0].content.parts[0].text.trim();
    } catch (error) {
        console.error('Error generating title:', error);
        return 'Untitled Story';
    }
}

// Update Story Stats
function updateStoryStats(content) {
    const wordCount = document.getElementById('word-count');
    const readingTime = document.getElementById('reading-time');
    
    const words = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / 200); // Average reading speed

    wordCount.textContent = `${words} words`;
    readingTime.textContent = `${minutes} min read`;
}

// Save/Load Stories
function setupSaveButton() {
    const saveBtn = document.getElementById('save-btn');
    saveBtn.addEventListener('click', saveCurrentStory);
}

async function saveCurrentStory() {
    const content = document.getElementById('story-content').textContent;
    const title = document.getElementById('story-title').textContent;
    
    if (content === 'Your story will appear here...') {
        alert('Generate a story first!');
        return;
    }

    const story = {
        title,
        content,
        genre: selectedGenre,
        style: selectedStyle,
        timestamp: new Date().toISOString()
    };

    const savedStories = JSON.parse(localStorage.getItem('saved_stories') || '[]');
    savedStories.push(story);
    localStorage.setItem('saved_stories', JSON.stringify(savedStories));
    
    loadSavedStories();
}

function loadSavedStories() {
    const savedStoriesList = document.getElementById('saved-stories-list');
    const savedStories = JSON.parse(localStorage.getItem('saved_stories') || '[]');
    
    savedStoriesList.innerHTML = savedStories
        .map((story, index) => `
            <div class="saved-story-card" onclick="loadStory(${index})">
                <h4>${story.title}</h4>
                <p>${story.content.substring(0, 100)}...</p>
                <small>${new Date(story.timestamp).toLocaleDateString()}</small>
            </div>
        `)
        .join('');
}

function loadStory(index) {
    const savedStories = JSON.parse(localStorage.getItem('saved_stories') || '[]');
    const story = savedStories[index];
    
    document.getElementById('story-title').textContent = story.title;
    document.getElementById('story-content').textContent = story.content;
    updateStoryStats(story.content);
}

// Social Sharing
function setupShareButtons() {
    document.querySelectorAll('.share-btn').forEach(btn => {
        btn.addEventListener('click', () => shareStory(btn.dataset.platform));
    });
}

function shareStory(platform) {
    const title = document.getElementById('story-title').textContent;
    const text = `Check out my AI-generated story: ${title}`;
    const url = window.location.href;

    const shareUrls = {
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`
    };

    window.open(shareUrls[platform], '_blank', 'width=600,height=400');
}

// Language Support
const translations = {
    en: {
        title: 'AI Story Generator',
        prompt: 'Enter your story idea...',
        generate: 'Generate Story',
        // Add more translations
    },
    es: {
        title: 'Generador de Historias IA',
        prompt: 'Ingresa tu idea para la historia...',
        generate: 'Generar Historia',
        // Add more translations
    }
    // Add more languages
};

function initializeLanguage() {
    const languageSelect = document.getElementById('language-select');
    languageSelect.addEventListener('change', (e) => {
        const lang = e.target.value;
        changeLanguage(lang);
    });
}

function changeLanguage(lang) {
    const elements = document.querySelectorAll('[data-translate]');
    elements.forEach(element => {
        const key = element.dataset.translate;
        if (translations[lang] && translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });
    localStorage.setItem('preferred-language', lang);
}

// Story Templates
const storyTemplates = {
    'hero-journey': {
        prompt: 'Write a story about a hero who must overcome great challenges to achieve their destiny.',
        structure: ['Call to Adventure', 'Trials', 'Transformation', 'Return']
    },
    'mystery': {
        prompt: 'Create a mystery story with an unexpected twist.',
        structure: ['Setup', 'Investigation', 'Red Herrings', 'Resolution']
    },
    'love-story': {
        prompt: 'Tell a touching love story with compelling characters.',
        structure: ['Meet', 'Conflict', 'Resolution', 'Unity']
    },
    'fairy-tale': {
        prompt: 'Create a magical fairy tale with enchanting elements.',
        structure: ['Once upon a time', 'Magic', 'Challenge', 'Happy Ending']
    }
};

function initializeTemplates() {
    document.querySelectorAll('.template-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const template = storyTemplates[btn.dataset.template];
            document.getElementById('prompt').value = template.prompt;
        });
    });
}

// Prompt Suggestions
function initializePromptSuggestions() {
    const suggestBtn = document.getElementById('suggest-prompt');
    const suggestionsPanel = document.getElementById('prompt-suggestions');
    
    suggestBtn.addEventListener('click', async () => {
        suggestionsPanel.classList.toggle('hidden');
        if (!suggestionsPanel.classList.contains('hidden')) {
            await generatePromptSuggestions();
        }
    });
}

async function generatePromptSuggestions() {
    const suggestionsPanel = document.getElementById('prompt-suggestions');
    const genre = selectedGenre || 'any';
    const style = selectedStyle || 'any';
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Generate 5 creative story prompt suggestions for a ${style} story in the ${genre} genre. Make them unique and engaging.`
                    }]
                }]
            })
        });

        const data = await response.json();
        const suggestions = data.candidates[0].content.parts[0].text
            .split('\n')
            .filter(s => s.trim());

        suggestionsPanel.innerHTML = suggestions
            .map(s => `<div class="suggestion-item">${s}</div>`)
            .join('');

        document.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                document.getElementById('prompt').value = item.textContent;
                suggestionsPanel.classList.add('hidden');
            });
        });
    } catch (error) {
        console.error('Error generating suggestions:', error);
        suggestionsPanel.innerHTML = '<div class="error">Failed to generate suggestions</div>';
    }
}

// Story Rating
function initializeRating() {
    const stars = document.querySelectorAll('.story-rating i');
    stars.forEach(star => {
        star.addEventListener('mouseover', () => {
            const rating = parseInt(star.dataset.rating);
            updateStars(rating);
        });
        
        star.addEventListener('click', () => {
            const rating = parseInt(star.dataset.rating);
            saveRating(rating);
        });
    });

    document.querySelector('.story-rating').addEventListener('mouseleave', () => {
        const savedRating = parseInt(localStorage.getItem('current-story-rating') || '0');
        updateStars(savedRating);
    });
}

function updateStars(rating) {
    document.querySelectorAll('.story-rating i').forEach(star => {
        const starRating = parseInt(star.dataset.rating);
        star.classList.toggle('active', starRating <= rating);
    });
}

function saveRating(rating) {
    localStorage.setItem('current-story-rating', rating.toString());
    // Could also save to a backend if available
}

// PDF Export
async function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const title = document.getElementById('story-title').textContent;
    const content = document.getElementById('story-content').textContent;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(title, 20, 20);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    
    const splitText = doc.splitTextToSize(content, 170);
    doc.text(splitText, 20, 40);
    
    doc.save(`${title.toLowerCase().replace(/\s+/g, '-')}.pdf`);
}

// Text-to-Speech
let speechSynthesis;
let speaking = false;

function initializeSpeech() {
    const speakBtn = document.getElementById('speak-btn');
    speakBtn.addEventListener('click', toggleNarration);
}

function toggleNarration() {
    if (speaking) {
        window.speechSynthesis.cancel();
        speaking = false;
        document.getElementById('speak-btn').innerHTML = '<i class="fas fa-volume-up"></i> Narrate';
        return;
    }

    const text = document.getElementById('story-content').textContent;
    if (text === 'Your story will appear here...') {
        alert('Generate a story first!');
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = document.getElementById('language-select').value;
    
    utterance.onend = () => {
        speaking = false;
        document.getElementById('speak-btn').innerHTML = '<i class="fas fa-volume-up"></i> Narrate';
    };

    speaking = true;
    document.getElementById('speak-btn').innerHTML = '<i class="fas fa-volume-mute"></i> Stop';
    window.speechSynthesis.speak(utterance);
}

// Story Illustration
async function generateIllustration() {
    const illustrationDiv = document.getElementById('story-illustration');
    const title = document.getElementById('story-title').textContent;
    const content = document.getElementById('story-content').textContent;

    illustrationDiv.innerHTML = '<div class="loading">Generating illustration...</div>';
    illustrationDiv.classList.remove('hidden');

    try {
        // Here you would typically call an image generation API like DALL-E or Stable Diffusion
        // For now, we'll use a placeholder
        const imageUrl = 'https://via.placeholder.com/300';
        illustrationDiv.innerHTML = `<img src="${imageUrl}" alt="Story Illustration">`;
    } catch (error) {
        console.error('Error generating illustration:', error);
        illustrationDiv.innerHTML = '<div class="error">Failed to generate illustration</div>';
    }
}

document.getElementById('pdf-btn').addEventListener('click', exportToPDF);
document.getElementById('illustrate-btn').addEventListener('click', generateIllustration);