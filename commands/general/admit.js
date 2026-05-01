const axios = require('axios');
const fs = require('fs');

module.exports = {
    name: 'admit',
    alias: ['jnvu'],
    category: 'general',
    async execute(m, { conn, text, args }) {
        try {
            // यहाँ हम check कर रहे हैं कि input 'text' से आ रहा है या 'args' से
            const formNumber = text || (args && args.length > 0 ? args[0] : null);

            if (!formNumber) {
                return m.reply("❌ कृपया फॉर्म नंबर दें।\nउदाहरण: `.admit 12880707` ");
            }

            await m.reply(`⏳ फॉर्म नंबर ${formNumber} के लिए एडमिट कार्ड सर्च कर रहा हूँ...`);

            // JNVU Direct Download Link Logic
            const url = `https://erp.jnvuiums.in/Exam/Pre_Exam/Exam_ForALL_AdmitCard.aspx?txtchallanNo=${formNumber.trim()}&btnGetResult=Download`;

            const response = await axios({
                method: 'get',
                url: url,
                responseType: 'arraybuffer',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            // चेक करें कि क्या वाकई PDF मिला है (JNVU कभी-कभी खाली पेज देता है)
            if (response.data.length < 1000) {
                return m.reply("❌ एडमिट कार्ड नहीं मिला। कृपया फॉर्म नंबर चेक करें।");
            }

            const path = `./${formNumber}.pdf`;
            fs.writeFileSync(path, response.data);

            await conn.sendMessage(m.chat, { 
                document: fs.readFileSync(path), 
                mimetype: 'application/pdf', 
                fileName: `JNVU_AdmitCard_${formNumber}.pdf`,
                caption: `✅ *JNVU Admit Card*\n🔹 Form No: ${formNumber}`
            }, { quoted: m });

            fs.unlinkSync(path); // File delete करें

        } catch (err) {
            console.error("Admit Command Error:", err);
            m.reply("❌ सर्वर एरर या इनवैलिड फॉर्म नंबर।");
        }
    }
};
