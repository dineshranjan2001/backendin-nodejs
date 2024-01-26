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
        fs.unlinkSync(localFilePath);
        return fileResponse;
    } catch (error) {
        //remove the locally saved file as the upload
        fs.unlinkSync(localFilePath);
        return null;
    }
}
const fileDeleteOnCloud=async(dbUserImageURL)=>{
    try {
        //Extract public_id from the dbUserImageURL between upload/ and file extension
        const PUBLIC_ID=dbUserImageURL.match(/upload\/([^\.]+)/);
        if(!PUBLIC_ID){
            return false;
        }
        const status=await cloudinary.uploader.destroy(PUBLIC_ID);
        if(status.result!=='ok'){
            return false;
        }
        return true;
    } catch (error) {
        console.log(error.message);
        return false;
    }
}
export {fileUploadOnCloud,fileDeleteOnCloud};