import jwt from "jsonwebtoken";

export function verifyToken(token: string): any {
    try {
        return jwt.verify(token, process.env.JWT_SECRET as string);
    } catch (error) {
        return null;
    }
}
