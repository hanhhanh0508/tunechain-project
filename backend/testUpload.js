import fs from 'fs';
import axios from 'axios';

async function runTest() {
  try {
    const filePath = './file_example_MP3_5MG.mp3'; // Tên file nhạc 5MB ông vừa bỏ vào
    console.log('1. Đang đọc file MP3...');
    
    // Đọc file dưới dạng Buffer
    const fileBuffer = fs.readFileSync(filePath);
    
    console.log('2. Đang mã hóa sang Base64...');
    const fileBase64 = fileBuffer.toString('base64');
    console.log(`-> Dung lượng chuỗi Base64: ${(fileBase64.length / 1024 / 1024).toFixed(2)} MB`);

    console.log('3. Đang gửi API POST lên Server...');
    const response = await axios.post('http://localhost:5000/api/upload/audio', {
      fileBase64: fileBase64,
      fileName: 'bai_hat_nang_demo.mp3',
      mimeType: 'audio/mpeg'
    }, {
      // Bật max length để axios không chặn payload lớn
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    console.log('✅ THÀNH CÔNG! Kết quả trả về:');
    console.log(response.data);

  } catch (error) {
    console.error('❌ LỖI RỒI:');
    if (error.response) {
      console.error(error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

runTest();