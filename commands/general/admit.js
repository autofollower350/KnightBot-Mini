const axios = require('axios');
const fs = require('fs');
const qs = require('qs');

module.exports = {
    name: 'admit',
    alias: ['jnvu'],
    category: 'general',
    async execute(m, args_obj) {
        // --- Universal Socket Finder ---
        // यह लाइन आपके बॉट के अंदर छिपे हुए 'sendMessage' फंक्शन को जबरदस्ती ढूंढ लेगी
        const bot = args_obj.conn || args_obj.client || args_obj.sock || args_obj.Knight || m.client || m.conn;

        if (!bot || typeof bot.sendMessage !== 'function') {
            console.log("CRITICAL: Could not find sendMessage function in any object!");
            return; 
        }

        const sendReply = async (txt) => {
            return await bot.sendMessage(m.chat, { text: txt }, { quoted: m });
        };

        try {
            // KnightBot-Mini में अक्सर 'text' args_obj के अंदर होता है
            const formNumber = args_obj.text || (args_obj.args && args_obj.args[0]) || null;

            if (!formNumber) {
                return await sendReply("❌ कृपया फॉर्म नंबर दें।\nउदाहरण: `.admit 12880707` ");
            }

            await sendReply(`🔍 फॉर्म नंबर ${formNumber} के लिए एडमिट कार्ड ढूंढ रहा हूँ...`);

            const postData = qs.stringify({
                '__EVENTTARGET': '',
                '__EVENTARGUMENT': '',
                'txtchallanNo': formNumber.trim(),
                'btnGetResult': 'Download'
            });

            const response = await axios({
                method: 'post',
                url: 'https://erp.jnvuiums.in/Exam/Pre_Exam/Exam_ForALL_AdmitCard.aspx',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                },
                data: postData,
                responseType: 'arraybuffer',
                timeout: 30000 
            });

            if (response.data.length < 2500) {
                return await sendReply("❌ एडमिट कार्ड नहीं मिला। शायद फॉर्म नंबर गलत है।");
            }

            const path = `./${formNumber}.pdf`;
            fs.writeFileSync(path, response.data);

            await bot.sendMessage(m.chat, { 
                document: fs.readFileSync(path), 
                mimetype: 'application/pdf', 
                fileName: `JNVU_AdmitCard_${formNumber}.pdf`,
                caption: `✅ *JNVU Admit Card*\n🔹 Form No: ${formNumber}`
            }, { quoted: m });

            if (fs.existsSync(path)) fs.unlinkSync(path);

        } catch (err) {
            console.error("Admit Command Error:", err.message);
            // यहाँ बिना Reply के सिर्फ Log कर रहे हैं ताकि बॉट क्रैश न हो
        }
    }
};
