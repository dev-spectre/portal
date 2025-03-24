import { useState } from "react";
import axios from "axios";
import { backendUrl, STATUS_CODES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  classId: number;
};

export default function AddStudentsToClass({ classId }: Props) {
  const [registerNumbers, setRegisterNumbers] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    const registerNumberArray = registerNumbers.split(",").map((num) => num.trim());
    if (registerNumberArray.length === 0) {
      setError("Please enter at least one register number.");
      return;
    }

    try {
      await axios.post(`${backendUrl}/faculty/student/`, { students: registerNumberArray.map((num) => ({ registerNumber: num })) }, { withCredentials: true, validateStatus: () => true });
      const response = await axios.post(`${backendUrl}/class/add/`, { classId, registerNumber: registerNumberArray }, { withCredentials: true, validateStatus: () => true });

      if (response.status === STATUS_CODES.CREATED) {
        setSuccess("Students added successfully!");
        setRegisterNumbers("");
      } else if (response.status === STATUS_CODES.FORBIDDEN) {
        setError("Invalid input format.");
      } else if (response.status === STATUS_CODES.SERVICE_UNVAILABLE) {
        setError("Service unavailable. Try again later.");
      } else {
        setError("Something went wrong.");
      }
    } catch (err) {
      setError("Failed to connect to server.");
    }
  };

  return (
    <Card className="border bg-black text-white border-white/30 rounded-lg p-4 w-full">
      <CardContent>
        <h2 className="text-xl font-semibold mb-4">Add Students to Class</h2>
        <Input
          type="text"
          placeholder="Enter register numbers, comma separated"
          value={registerNumbers}
          onChange={(e) => setRegisterNumbers(e.target.value)}
          className="border border-white/30 w-full mb-4"
        />
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        {success && <p className="text-green-500 text-sm mt-2">{success}</p>}
        <Button onClick={handleSubmit} className="w-full mt-4">
          Add Students
        </Button>
      </CardContent>
    </Card>
  );
}
