const wa = require('@open-wa/wa-automate');
const axios = require('axios');

// إعداد Puppeteer لاستخدام Chrome بشكل يدوي
wa.create({
  useChrome: true, // تأكد من أنك تستخدم متصفح Chrome أو Chromium
  headless: true, // تشغيل المتصفح بدون واجهة رسومية
  executablePath: '/usr/bin/chromium-browser',  // تحديد المسار إذا لزم الأمر (تأكد من أنه متاح في البيئة)
  args: [
    '--no-sandbox', // تعطيل sandbox
    '--disable-setuid-sandbox', // تعطيل setuid-sandbox
    '--disable-gpu', // تعطيل GPU لتسريع العملية في بيئات غير رسومية
    '--headless', // تشغيل في وضع headless (بدون واجهة رسومية)
    '--remote-debugging-port=9222' // فتح منفذ تصحيح عن بعد
  ], // هذه الخيارات تساعد في حل مشاكل sandbox
}).then(client => start(client));

function start(client) {
  console.log('WhatsApp Web Client started');

  // دالة لتنسيق الوقت
  function formatTime(timestamp) {
    return new Date(timestamp).toLocaleString();
  }

  // دالة لجلب بيانات اللاعب من API
  async function getPlayerData(uid) {
    const url = `https://fox-api-lyart.vercel.app/info?id=${uid}`;
    const response = await axios.get(url);
    return response.data;
  }

  // دالة لتنسيق النصوص
  function createFormattedText(data) {
    return `
┐──────معلومات لاعب──────┌
    
    🎮 Player Activity:
    ├─ Last Login: ${formatTime(data.basicInfo.lastLoginAt)}
    └─ Account Created: ${formatTime(data.basicInfo.createAt)}

    👤 Basic Information:
    ├─ Nickname: ${data.basicInfo.nickname || 'Not Available'}
    ├─ Account ID: ${data.basicInfo.accountId || 'Not Available'}
    ├─ Region: ${data.basicInfo.region || 'Not Available'}
    ├─ Level: ${data.basicInfo.level || 'Not Available'}
    ├─ Badges: ${data.basicInfo.badgeCnt || 'Not Available'}
    ├─ Likes: ${data.basicInfo.liked || 'Not Available'}
    ├─ Avatar: ${data.basicInfo.headPic || 'Not Available'}
    └─ Experience: ${data.basicInfo.exp || 'Not Available'}

    📈 Player Ranking:
    ├─ BR Ranking Points: ${data.basicInfo.rankingPoints || 'Not Available'}
    ├─ CS Ranking Points: ${data.basicInfo.csRankingPoints || 'Not Available'}
    ├─ BR Rank Visibility: ${data.basicInfo.showBrRank ? 'Visible' : 'Hidden'}
    └─ CS Rank Visibility: ${data.basicInfo.showCsRank ? 'Visible' : 'Hidden'}

    💬 Social Information:
    ├─ Time Active: ${data.socialInfo.timeActive || 'Not Available'}
    ├─ Language: ${data.socialInfo.language || 'Not Available'}
    └─ Signature: ${data.socialInfo.signature || 'Not Available'}

    👥 Clan Information:
    ├─ Clan Name: ${data.clanBasicInfo.clanName || 'Not Available'}
    ├─ Clan ID: ${data.clanBasicInfo.clanId || 'Not Available'}
    ├─ Clan Level: ${data.clanBasicInfo.clanLevel || 'Not Available'}
    ├─ Members Count: ${data.clanBasicInfo.memberNum || 'Not Available'}
    └─ Clan Leader: ${data.captainBasicInfo ? data.captainBasicInfo.nickname : 'Not Available'}

    🐾 Pet Information:
    ├─ Pet Name: ${data.petInfo.name || 'Not Available'}
    ├─ Pet Level: ${data.petInfo.level || 'Not Available'}
    ├─ Pet Experience: ${data.petInfo.exp || 'Not Available'}
    └─ Pet Skill: ${data.petInfo.selectedSkillId || 'Not Available'}

    └────────────────────┘
    `;
  }

  // دالة للبحث عن icon باستخدام Avatar ID
  async function getIconFromAvatar(avatarId) {
    try {
      const itemsData = await axios.get("https://raw.githubusercontent.com/TH-HACK/l7aj-Items/refs/heads/main/itemData.json");
      const items = itemsData.data;
      const item = items.find(item => item.itemID === avatarId);
      return item ? item.icon : null;
    } catch (error) {
      console.error("Error fetching item data:", error);
    }
    return null;
  }

  // دالة لإنشاء رابط الصورة النهائية
  async function getImageUrl(iconName) {
    try {
      const listData = await axios.get("https://raw.githubusercontent.com/jinix6/ff-resources/refs/heads/main/pngs/300x300/list.json");
      const list = listData.data;
      const item = list.find(item => item.includes(iconName));
      return item ? `https://raw.githubusercontent.com/jinix6/ff-resources/refs/heads/main/pngs/300x300/${item}` : null;
    } catch (error) {
      console.error("Error fetching image list:", error);
    }
    return null;
  }

  // استقبال الرسائل
  client.onMessage(async message => {
    const messageText = message.body.trim();

    // إذا كانت الرسالة تبدأ بـ ".info "
    if (messageText.startsWith('.info ')) {
      const uid = messageText.slice(6).trim(); // إزالة ".info " من النص
      const data = await getPlayerData(uid);
      const avatarId = data.basicInfo.headPic || 'Not Available';
      
      const iconName = await getIconFromAvatar(avatarId);
      const imageUrl = iconName ? await getImageUrl(iconName) : null;
      const formattedText = createFormattedText(data);

      // إرسال المعلومات والصورة
      if (imageUrl) {
        await client.sendImage(message.from, imageUrl, 'Player Info', formattedText);
      } else {
        await client.sendText(message.from, formattedText);
      }
    }

    // الرد على .menu
    if (messageText === '.menu') {
      await client.sendText(message.from, 'قائمة الأوامر: \n 1. .menu \n 2. معلومات');
    }

    // رد تلقائي على "معلومات"
    if (messageText === 'معلومات') {
      await client.sendText(message.from, 'هذا هو البوت الذي يرد على الرسائل!');
    }
  });

  // رسالة ترحيب عند تشغيل البوت
  client.sendText('رقم الهاتف هنا@c.us', 'تم تشغيل البوت بنجاح!');
  }
