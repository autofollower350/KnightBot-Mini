const { exec } = require('child_process');
const fs = require('fs');

module.exports = {
    name: 'admit',
    alias: ['jnvu', 'card'],
    category: 'education',
    desc: 'Download JNVU Admit Card',
    async run({ sock, m, args }) {
        const formNo = args[0];
        if (!formNo) return m.reply('❌ Bhai, Form Number toh likho!\nExample: `.admit 12345`');

        await m.reply('⏳ *Knight Bot* aapka admit card fetch kar raha hai... thoda intezar karein.');

        // Python command run karna
        exec(`python3 jnvu.py ${formNo}`, async (err, stdout, stderr) => {
            const pdfPath = `./admit_card_${formNo}.pdf`; 

            if (fs.existsSync(pdfPath)) {
                await sock.sendMessage(m.chat, { 
                    document: { url: pdfPath }, 
                    mimetype: 'application/pdf', 
                    fileName: `JNVU_Admit_${formNo}.pdf`,
                    caption: `✅ *JNVU Admit Card*\n📝 Form No: ${formNo}\n🤖 Powered by Knight Bot`
                }, { quoted: m });

                // File delete karna
                setTimeout(() => { fs.unlinkSync(pdfPath); }, 5000);
            } else {
                await m.reply('❌ *Error:* Admit card nahi mila. Ya toh form number galat hai ya JNVU server down hai.');
                console.error(stderr);
            }
        });
    }
};
