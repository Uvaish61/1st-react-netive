import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

UserSchema.pre<IUser>('save', async function save(next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (error) {
    next(error as Error);
  }
});

UserSchema.methods.comparePassword = function comparePassword(candidatePassword: string) {
  const user = this as IUser;
  return bcrypt.compare(candidatePassword, user.password);
};

UserSchema.set('toJSON', {
  transform: (_doc, ret: Record<string, unknown>) => {
    delete ret.password;
    return ret;
  },
});

const User = mongoose.model<IUser>('User', UserSchema);

export default User;