const fs = require('fs');
const { bucket } = require('../../config/firebase');

exports.uploadFile = async (req, res) => {
  try {
    const localFilePath = req.file.path;
    const destination = `pdfs/${req.file.originalname}`;

    await bucket.upload(localFilePath, {
      destination,
      metadata: {
        contentType: 'application/pdf',
      },
    });

    fs.unlinkSync(localFilePath);

    const file = bucket.file(destination);
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: '03-09-2030',
    });

    res.json({ message: 'PDF uploaded successfully', url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Upload failed' });
  }
};