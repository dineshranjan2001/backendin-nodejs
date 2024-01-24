import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

          
cloudinary.config({ 
  cloud_name: process.env.CLOUD_NAME, 
  api_key: process.env.CLOUD_API_KEY,
  api_secret:process.env.CLOUD_API_SECRET
});

const fileUploadOnCloud= async (localFilePath)=>{
    try {
        if(!localFilePath) return null;
        //upload file on the cloudinary 
        const fileResponse=await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        });
        //after succesfully file upload on the cloudinary server
        console.log(fileResponse);
        return fileResponse;
    } catch (error) {
        //remove the locally saved file as the upload
        fs.unlinkSync(localFilePath);
        return null;
    }
}

export {fileUploadOnCloud};