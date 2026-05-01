const axios = require('axios');
const fs = require('fs');
const qs = require('qs');

module.exports = {
    name: 'admit',
    alias: ['jnvu'],
    category: 'general',
    async execute(m, { conn, client, sock, text }) {
        // यह लाइन चेक करेगी कि मैसेज भेजने वाला फंक्शन कौन सा उपलब्ध है
        const bot = conn || client || sock || m.client;
        
        const sendReply = async (txt) => {
            return await bot.sendMessage(m.chat, { text: txt }, { quoted: m });
        };

        try {
            const formNumber = text ? text.trim() : null;

            if (!formNumber) {
                return await sendReply("❌ कृपया फॉर्म नंबर दें।\nउदाहरण: `.admit 12880707` ");
            }

            await sendReply(`🔍 फॉर्म नंबर ${formNumber} के लिए एडमिट कार्ड ढूंढ रहा हूँ...`);

            const postData = qs.stringify({
                '__EVENTTARGET': '',
                '__EVENTARGUMENT': '',
                'txtchallanNo': formNumber,
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
            await sendReply("❌ सर्वर एरर आया है। कृपया फिर से कोशिश करें।");
        }
    }
};

