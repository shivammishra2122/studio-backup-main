'use client';

import * as React from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardTitle, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import { setSession } from '@/lib/auth-utils';
import { authApi } from '@/services/api';
import { useRouter } from 'next/navigation';

const loginSchema = z.object({
  accessCode: z.string().min(1, { message: "Access code is required." }),
  verificationCode: z.string().min(1, { message: "Verification code is required." }),
  locationId: z.string().min(1, { message: "Please select a location." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

type Location = {
  id: string;
  name: string;
};

export function LoginForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isLoadingLocations, setIsLoadingLocations] = React.useState(false);
  const [locations, setLocations] = React.useState<Location[]>([]);
  const [accessCode, setAccessCode] = React.useState("");
  const router = useRouter();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      accessCode: "",
      verificationCode: "",
      locationId: "",
    },
  });

  // Fetch locations when access code changes
  React.useEffect(() => {
    const fetchLocations = async () => {
      if (!accessCode || accessCode.length < 3) {
        setLocations([]);
        form.setValue('locationId', '');
        return;
      }

      setIsLoadingLocations(true);
      try {
        const data = await authApi.getLocations(accessCode);
        const locationsData = Object.entries(data)
          .filter(([key]) => key !== 'default')
          .map(([id, name]) => ({
            id: String(id),
            name: String(name)
          }));
        
        setLocations(locationsData);
        
        // Find and select HOSPITAL ONE if it exists
        const hospitalOne = locationsData.find(loc => 
          loc.name.toUpperCase().includes('HOSPITAL ONE')
        );
        
        if (hospitalOne) {
          form.setValue('locationId', hospitalOne.id);
        } else if (locationsData.length > 0) {
          // If HOSPITAL ONE not found, select the first location
          form.setValue('locationId', locationsData[0].id);
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
        toast({
          title: "Error",
          description: "Failed to fetch locations. Please try again.",
          variant: "destructive",
        });
        setLocations([]);
      } finally {
        setIsLoadingLocations(false);
      }
    };

    const timer = setTimeout(() => {
      fetchLocations();
    }, 300); // Add debounce

    return () => clearTimeout(timer);
  }, [accessCode, form, toast]);

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const result = await authApi.login({
        access: data.accessCode,
        verify: data.verificationCode,
        htLocation: data.locationId
      });

      if (result.succeeded === true) {
        setSession({
          duz: result.DUZ || '',
          htLocation: data.locationId,
          userName: data.accessCode,
          password: data.verificationCode,
          name: result.DUZName
        });
        
        toast({
          title: "Login Successful",
          description: `Welcome, ${result.DUZName || 'User'}!`,
        });
        
        router.push('/patients');
      } else {
        throw new Error(result.errors || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "An error occurred during login. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md p-6 shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Login</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form 
          onSubmit={form.handleSubmit(onSubmit)} 
          className="space-y-4"
          autoComplete="off"
          id="loginForm"
        >
          <input type="text" name="username" autoComplete="username" style={{ display: 'none' }} />
          <input type="password" name="password" autoComplete="new-password" style={{ display: 'none' }} />
          
          <div className="space-y-2">
            <Label htmlFor="accessCode">Access Code</Label>
            <Input 
              id="accessCode"
              type="text"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              inputMode="numeric"
              placeholder="Enter your access code" 
              {...form.register("accessCode")}
              onChange={(e) => setAccessCode(e.target.value)}
              value={accessCode}
              className="[&::-webkit-contacts-auto-fill-button]:hidden [&::-webkit-credentials-auto-fill-button]:hidden"
              data-lpignore="true"
              data-form-type="other"
            />
            {form.formState.errors.accessCode && (
              <p className="text-red-500 text-xs">{form.formState.errors.accessCode.message}</p>
            )}
          </div>
          
          {accessCode && (
            <>
              <div className="space-y-2">
                <Label htmlFor="verificationCode">Verification Code</Label>
                <Input 
                  id="verificationCode"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Enter your verification code" 
                  {...form.register("verificationCode")}
                  className="[&::-webkit-contacts-auto-fill-button]:hidden [&::-webkit-credentials-auto-fill-button]:hidden"
                  data-lpignore="true"
                  data-form-type="other"
                />
                {form.formState.errors.verificationCode && (
                  <p className="text-red-500 text-xs">{form.formState.errors.verificationCode.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="locationId">Location</Label>
                <Select
                  onValueChange={(value) => form.setValue('locationId', value)}
                  value={form.watch('locationId')}
                  disabled={isLoadingLocations}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      isLoadingLocations ? 'Loading locations...' : 'Select a location'
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                    {locations.length === 0 && !isLoadingLocations && (
                      <div className="text-sm p-2 text-gray-500">
                        {accessCode ? 'No locations found for this access code' : 'Enter an access code to see locations'}
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {form.formState.errors.locationId && (
                  <p className="text-red-500 text-xs">{form.formState.errors.locationId.message}</p>
                )}
              </div>
            </>
          )}

          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700" 
            disabled={isLoading || (accessCode !== "" && isLoadingLocations)}
          >
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
