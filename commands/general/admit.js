const { chromium } = require('playwright');
const fs = require('fs');
const pdf = require('pdf-parse');

module.exports = {
    name: 'admit',
    aliases: ['jnvu', 'search'],
    category: 'general',
    description: 'Download and Extract JNVU Admit Card Info',
    usage: '.admit [form_number]',

    async execute(sock, msg, args, extra) {
        const formNo = args[0];
        if (!formNo) return await extra.reply("❌ कृपया फॉर्म नंबर लिखें।");

        await extra.reply(`🔍 Form ${formNo} के लिए ब्राउज़र स्टार्ट कर रहा हूँ... (इसमें समय लग सकता है)`);

        const pdfPath = `./admit_card_${formNo}.pdf`;
        let browser;

        try {
            // 1. Browser Launch (Heavily resource intensive)
            browser = await chromium.launch({ 
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'] 
            });
            const context = await browser.newContext({ acceptDownloads: true });
            const page = await context.newPage();

            const url = "https://erp.jnvuiums.in/(S(biolzjtwlrcfmzwwzgs5uj5n))/Exam/Pre_Exam/Exam_ForALL_AdmitCard.aspx";

            await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
            await page.fill("#txtchallanNo", formNo);
            
            const submitBtn = page.locator("#btnGetResult");

            // 2. Download PDF logic
            const [download] = await Promise.all([
                page.waitForEvent('download', { timeout: 30000 }),
                submitBtn.click()
            ]);

            await download.saveAs(pdfPath);
            await browser.close();

            // 3. Extract Info from PDF
            const dataBuffer = fs.readFileSync(pdfPath);
            const pdfData = await pdf(dataBuffer);
            const text = pdfData.text;

            let info = { 
                name: text.match(/NAME OF CANDIDATE\s*:\s*(.*)/)?.[1]?.split('\n')[0]?.trim() || "Not Found",
                father: text.match(/FATHER'S NAME\s*:\s*(.*)/)?.[1]?.split('\n')[0]?.trim() || "Not Found",
                roll: text.match(/Roll no is\s+([\w\d]+)/)?.[1]?.trim() || "Not Found",
                center: text.match(/Exam Centre is\s*([\s\S]*?)(?=Print Date|To,|The Centre|NAME OF EXAMINATION)/)?.[1]?.replace(/\s+/g, ' ')?.trim() || "Not Found"
            };

            // 4. Send Info & File to WhatsApp
            const caption = `✅ *JNVU ADMIT CARD FOUND*\n\n` +
                          `👤 *Name:* ${info.name}\n` +
                          `👨‍👦 *Father:* ${info.father}\n` +
                          `🔢 *Roll No:* ${info.roll}\n` +
                          `📍 *Center:* ${info.center}\n\n` +
                          `_Bot is sending your PDF file below..._`;

            await sock.sendMessage(extra.from, { 
                document: fs.readFileSync(pdfPath), 
                mimetype: 'application/pdf', 
                fileName: `JNVU_${formNo}.pdf`,
                caption: caption
            }, { quoted: msg });

            // 5. Cleanup
            if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);

        } catch (error) {
            console.error(error);
            if (browser) await browser.close();
            await extra.reply("❌ Error: एडमिट कार्ड नहीं मिला या वेबसाइट ने रिस्पॉन्स नहीं दिया।");
        }
    }
};
