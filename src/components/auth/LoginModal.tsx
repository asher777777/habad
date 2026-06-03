import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/useAuthStore";

import { useRouter } from "next/navigation";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const router = useRouter();
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const setUser = useAuthStore((state) => state.setUser);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "admin" && password === "123456") {
      setUser({
        id: "1",
        name: "Admin",
        email: "admin@habad.local",
        role: "ADMIN",
      });
      setUsername("");
      setPassword("");
      setError("");
      onClose();
      router.push("/dashboard");
    } else {
      setError("שם משתמש או סיסמה שגויים");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Content>
        <Modal.Header title="התחברות למערכת" description="הכנס שם משתמש וסיסמה כדי להתחבר" />
        <Modal.Close />
        
        <form onSubmit={handleLogin} className="space-y-4 mt-4" dir="rtl">
          {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
          <div className="space-y-2">
            <label className="text-sm font-medium">שם משתמש</label>
            <Input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder="הכנס שם משתמש"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">סיסמה</label>
            <Input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="הכנס סיסמה"
              required
            />
          </div>
          <Modal.Footer>
            <Button type="button" variant="outline" onClick={onClose} className="ml-2">ביטול</Button>
            <Button type="submit" variant="primary">התחבר</Button>
          </Modal.Footer>
        </form>
      </Modal.Content>
    </Modal>
  );
}
