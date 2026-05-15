import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { useEffect } from "react";

const PendingHouseowner = () => {

    useEffect(() => {
        document.title = "Pending Verification";
    })

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-center text-2xl font-semibold">
                        Account Under Review
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center space-y-4">
                        <div className="h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center">
                            <Check className="h-8 w-8 text-yellow-600" />
                        </div>
                        <div className="text-center space-y-2">
                            <h2 className="text-xl font-medium text-gray-900">
                                Thank you for registering!
                            </h2>
                            <p className="text-gray-500">
                                Your account is currently pending approval from our administrators.
                                We&apos;ll notify you via email once your account has been reviewed.
                            </p>
                        </div>
                        <div className="mt-6 text-sm text-gray-500 text-center">
                            For any inquiries, please contact our support team.
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default PendingHouseowner;