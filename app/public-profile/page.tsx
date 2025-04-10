'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useSession } from 'next-auth/react';
import { TwoFactorForm } from '@/components/auth/TwoFactorForm';
import { api } from '@/lib/api/api';
import { useToast } from '@/contexts/ToastContext';
import { UserResponse } from '@/lib/api/types';
import { Role } from '@prisma/client';

interface ExtendedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  phoneNumber?: string;
  address?: string;
  birthdate?: string;
  gender?: string;
  twoFactorEnabled?: boolean;
}

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const user = session?.user as ExtendedUser;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const toast = useToast();
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Implement password change API call
      await api.post('/api/users/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      setSuccess('Password updated successfully');
      toast.showSuccess('Password updated successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update password';
      setError(errorMessage);
      toast.showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorToggle = async () => {
    if (user?.twoFactorEnabled) {
      // If 2FA is already enabled, disable it
      try {
        setLoading(true);
        await api.post('/api/users/disable-2fa', {});
        if (session?.user) {
          await update({
            ...session,
            user: {
              ...session.user,
              twoFactorEnabled: false
            }
          });
        }
        toast.showSuccess('Two-factor authentication disabled');
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Failed to disable two-factor authentication';
        toast.showError(errorMessage);
      } finally {
        setLoading(false);
      }
    } else {
      // If 2FA is not enabled, show setup dialog
      try {
        setLoading(true);
        await api.get('/api/users/setup-2fa');
        setShowTwoFactorSetup(true);
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Failed to initialize two-factor authentication';
        toast.showError(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleTwoFactorSetup = async (code: string) => {
    try {
      setLoading(true);
      // Implement 2FA verification API call
      await api.post('/api/users/verify-2fa', { code });

      await update({
        ...session,
        user: {
          ...session?.user,
          twoFactorEnabled: true
        }
      });
      setSuccess('Two-factor authentication enabled successfully');
      toast.showSuccess('Two-factor authentication enabled successfully');
      setShowTwoFactorSetup(false);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to verify two-factor code';
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorResend = async () => {
    try {
      setLoading(true);
      // Implement 2FA code resend API call
      await api.post('/api/users/resend-2fa');

      toast.showSuccess('Verification code resent to your email');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to resend verification code';
      toast.showError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Profile Settings
        </Typography>

        <Grid container spacing={3}>
          {/* Account Information */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Account Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Name"
                    value={session?.user?.name}
                    disabled
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={session?.user?.email}
                    disabled
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Role"
                    value={session?.user?.role}
                    disabled
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Security Settings */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Security Settings
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {success}
                </Alert>
              )}

              <Box component="form" onSubmit={handlePasswordChange}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="password"
                      label="Current Password"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          currentPassword: e.target.value,
                        })
                      }
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="password"
                      label="New Password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          newPassword: e.target.value,
                        })
                      }
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="password"
                      label="Confirm New Password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          confirmPassword: e.target.value,
                        })
                      }
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={loading}
                    >
                      Update Password
                    </Button>
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ my: 3 }} />

              <FormControlLabel
                control={
                  <Switch
                    checked={user?.twoFactorEnabled || false}
                    onChange={handleTwoFactorToggle}
                    disabled={loading}
                  />
                }
                label="Enable Two-Factor Authentication"
              />
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Two-Factor Setup Dialog */}
      <Dialog
        open={showTwoFactorSetup}
        onClose={() => setShowTwoFactorSetup(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
        <DialogContent>
          <TwoFactorForm
            email={user?.email || ''}
            onVerify={handleTwoFactorSetup}
            onResend={handleTwoFactorResend}
          />
        </DialogContent>
      </Dialog>
    </Container>
  );
} 