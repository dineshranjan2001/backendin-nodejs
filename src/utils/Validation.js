import validator from "validator";

const isValidated=(user)=>{
    const {username,email,fullname,avatar,password}=user;
    if([username,email,fullname,avatar,password].every((field)=>field?.trim()==="")) return [true,"All fields are required"];
    else if(validator.isEmpty(username)) return[true,"Username is required"];
    else if(!validator.isAlphanumeric() && validator.matches(username,"/^[!@#%^&*()_+-=[]{}|;':\",./<>?~`]$/"))return [true,"Please give valid username"];
    else if(!validator.isEmail(email))return [true,"Please give valid email address"];
    else if(validator.isEmpty(email))return[true,"Email is required"];
    else if(validator.isEmpty(fullname))return[true,"Fullname is required"];
    else if(!validator.isAlpha(fullname)) return [true,"Please give valid fullname"];
    else if(validator.isEmpty(password))return[true,"Password is required"];
    else if(!validator.isAlphanumeric(password))return[true,"Please give valid password"];
} 

export {isValidated};
