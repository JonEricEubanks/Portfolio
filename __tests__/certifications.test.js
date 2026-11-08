const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const portfolioHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const credentialTitle = 'Microsoft Certified: AI Transformation Leader';
const credentialImage = 'Images/ai-transformation-leader.png';
const credentialLink = 'https://learn.microsoft.com/api/credentials/share/en-us/JonEricEubanks/3816AC9CBC5047DD?sharingId=A81001FBB40B8274';

beforeEach(() => {
    const body = portfolioHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i)[1];
    document.body.innerHTML = body.replace(/<script[\s\S]*?<\/script>/gi, '');
    window.blogManager = { posts: [], getPostsForContext: () => [] };
});

test('credential group counts match the entries on the page', () => {
    const groups = document.querySelectorAll('#certifications [data-credential-type]');
    expect(groups).toHaveLength(3);

    groups.forEach(group => {
        const displayedCount = Number(group.querySelector('.credential-count').textContent);
        expect(displayedCount).toBe(group.querySelectorAll('.certification-item').length);
    });
});

test('credential modals reference existing images and HTTPS verification links', () => {
    const credentials = document.querySelectorAll('#certifications .certification-item.modal-trigger');
    expect(credentials.length).toBeGreaterThan(0);

    credentials.forEach(credential => {
        const image = credential.getAttribute('data-modal-image');
        const link = credential.getAttribute('data-modal-link');

        expect(credential.getAttribute('data-modal-title')).toBeTruthy();
        expect(image).toMatch(/^Images\/.+/);
        expect(fs.existsSync(path.join(root, image))).toBe(true);
        expect(new URL(link).protocol).toBe('https:');
    });
});

test('the AI Transformation Leader certification displays the supplied image and verification link', () => {
    const credential = document.querySelector(
        '#certifications [data-credential-type="certification"] [data-modal-title="Microsoft Certified: AI Transformation Leader"]'
    );
    expect(credential).not.toBeNull();
    expect(credential.classList.contains('modal-trigger')).toBe(true);
    expect(credential.getAttribute('data-modal-image')).toBe(credentialImage);
    expect(credential.getAttribute('data-modal-link')).toBe(credentialLink);
    expect(credential.textContent.trim()).toBe(credentialTitle);
});

test('the chatbot includes the new certification in grounded answers', () => {
    jest.resetModules();
    const { JonEricChatBot } = require('../chat.js');
    const bot = new JonEricChatBot();

    expect(bot.portfolioData.certifications).toEqual(expect.arrayContaining([
        expect.objectContaining({ title: credentialTitle, type: 'certification' })
    ]));
    const answer = bot.getCredentialsResponse();
    expect(answer).toContain(credentialTitle);
    expect(answer).toContain('Sources: [Certifications](#certifications)');
});

test('the career timeline links to the new certification', () => {
    const timelineHtml = fs.readFileSync(path.join(root, 'career-timeline.html'), 'utf8');
    const timeline = new DOMParser().parseFromString(timelineHtml, 'text/html');
    const entry = timeline.querySelector('[data-year="Nov 2026"]');

    expect(entry).not.toBeNull();
    expect(entry.textContent).toContain(credentialTitle);
    expect(entry.querySelector('img').getAttribute('src')).toBe(credentialImage);
    expect(entry.querySelector('a').getAttribute('href')).toBe(credentialLink);
});
