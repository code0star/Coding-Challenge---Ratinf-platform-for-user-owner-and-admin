// src/utils/auth.js
import { createClient } from '@supabase/supabase-js';


const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function signUp(email) {
  // Passwordless sign-up (magic link)
  const { data, error } = await supabase.auth.signUp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) throw error;

  alert("Check your email for a magic link to complete sign-up.");
  return data.user;
}

async function signInWithMagicLink(email) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`
    }
  });

  if (error) {
    console.error('Error sending magic link:', error.message);
    return { success: false, message: error.message };
  }

  alert('Check your email for the magic link to sign in!');
  return { success: true };
}


export async function signIn(email, password) {
  if (!password) throw new Error("Password is required for sign in.");
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Add email validation function with common typo checks
function isValidEmail(email) {
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, message: "Please enter a valid email address (e.g., user@example.com)" };
  }

  // Check for common typos in popular email domains
  const commonTypos = {
    'gamil.com': 'gmail.com',
    'gmial.com': 'gmail.com',
    'gnail.com': 'gmail.com',
    'gmal.com': 'gmail.com',
    'gmil.com': 'gmail.com',
    'hotmal.com': 'hotmail.com',
    'hotmial.com': 'hotmail.com',
    'hotmal.co': 'hotmail.com',
    'yaho.com': 'yahoo.com',
    'yahooo.com': 'yahoo.com',
    'outlok.com': 'outlook.com',
    'outloo.com': 'outlook.com'
  };

  const [localPart, domain] = email.toLowerCase().split('@');
  if (commonTypos[domain]) {
    return { 
      valid: false, 
      message: `Did you mean ${localPart}@${commonTypos[domain]}?`,
      suggestion: `${localPart}@${commonTypos[domain]}`
    };
  }

  return { valid: true };
}

// Add function to check all role tables
export async function checkAllRoleTables(email, selectedRole = null) {
  console.log('Checking role tables for email:', email, 'selected role:', selectedRole);
  
  // If a specific role is selected, only check that role's table
  const roles = selectedRole ? [selectedRole.toLowerCase() + 's'] : ['users', 'owners', 'admins'];
  const results = {};

  for (const role of roles) {
    try {
      console.log(`Checking ${role} table...`);
      const { data, error } = await supabase
        .from(role)
        .select()
        .eq('email', email)
        .maybeSingle();
      
      if (error) {
        console.error(`Error checking ${role} table:`, error);
        continue;
      }
      
      if (data) {
        console.log(`Found user in ${role} table:`, data);
        results[role] = data;
      } else {
        console.log(`No user found in ${role} table`);
      }
    } catch (err) {
      console.error(`Error querying ${role} table:`, err);
      continue;
    }
  }

  console.log('Final role check results:', results);
  return results;
}

/**
 * role: string ("User", "Owner", "Admin")
 * user: supabase auth user object or null
 * email: string or null
 * password: string or null (required for sign in)
 */
export const loginUserWithRole = async (email, password, selectedRole) => {
  const roleTable = `${selectedRole.toLowerCase()}s`;
  console.log(`[loginUserWithRole] Started for email: ${email}, role: ${selectedRole}`);

  // Step 1: Check if user exists in the role table
 const { data: roleData, error: roleError } = await supabase
  .from(roleTable)
  .select()
  .eq('email', email)
  .eq('password', password)
  .single();

if (roleError) {
  console.error(`[loginUserWithRole] Error checking role table (${roleTable}):`, roleError);
} else {
  console.log(`[loginUserWithRole] Role table check result (email+password):`, roleData);
}

// If user exists with matching email and password, return success
if (roleData) {
  console.log(`[loginUserWithRole] User exists with matching email and password in role table: ${roleTable}`);
  return {
    status: 'success',
    user: roleData,
    role: selectedRole.toLowerCase()
  };
}

// If no match found for both email and password, check if email exists alone
const { data: emailExists, error: emailError } = await supabase
  .from(roleTable)
  .select()
  .eq('email', email)
  .single();

if (emailError) {
  console.error(`[loginUserWithRole] Error checking email existence in role table (${roleTable}):`, emailError);
} else {
  console.log(`[loginUserWithRole] Email exists check result:`, emailExists);
}

// If email exists but password didn't match, return invalid password error
if (emailExists) {
  console.log(`[loginUserWithRole] Password mismatch for email: ${email}`);
  return {
    status: 'error',
    message: 'Invalid password'
  };
}

// If email does NOT exist, ask user to register
console.log(`[loginUserWithRole] Email not found in role table: ${email}`);
return {
  status: 'error',
  message: 'Please register'
};

 }; 
 
 // Step 2: If not in role table, check if user exists in auth via magic link (OTP)


export const registerUserWithRole = async (email, password, role, name, address) => {
  try {
    // First, check if user exists in the appropriate role table
    let roleTable;
    switch (role.toLowerCase()) {
      case 'user':
        roleTable = 'users';
        break;
      case 'owner':
        roleTable = 'owners';
        break;
      case 'admin':
        roleTable = 'admins';
        break;
      default:
        throw new Error('Invalid role selected');
    }

    // Check if email already exists in the role table
    const { data: existingUser, error: checkError } = await supabase
      .from(roleTable)
      .select('email')
      .eq('email', email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
      throw checkError;
    }

    if (existingUser) {
      return {
        status: 'error',
        message: 'Email already registered. Please login instead.'
      };
    }

    // Send magic link for email verification
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?role=${role}&name=${encodeURIComponent(name)}&address=${encodeURIComponent(address)}&password=${encodeURIComponent(password)}&email=${encodeURIComponent(email)}`,
      },
    });

    if (otpError) throw otpError;

    // Show alert to check email
    alert('Please check your email for the verification link to complete your registration.');

    return {
      status: 'pending',
      message: 'Please check your email for the magic link to complete registration.'
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      status: 'error',
      message: error.message
    };
  }
};

// New function to handle the actual user insertion after email verification
export const completeRegistration = async (email, role, name, address, password) => {
  try {
    let roleTable;
    switch (role.toLowerCase()) {
      case 'user':
        roleTable = 'users';
        break;
      case 'owner':
        roleTable = 'owners';
        break;
      case 'admin':
        roleTable = 'admins';
        break;
      default:
        throw new Error('Invalid role selected');
    }

    // Insert user data into role table
    const { error: roleError } = await supabase
      .from(roleTable)
      .insert([{
        email,
        name,
        address,
        password,
        created_at: new Date().toISOString()
      }]);

    if (roleError) throw roleError;

    return {
      status: 'success',
      message: 'Registration completed successfully.'
    };
  } catch (error) {
    console.error('Registration completion error:', error);
    return {
      status: 'error',
      message: error.message
    };
  }
};

// Add this new function to handle auth callback
export const handleAuthCallback = async () => {
  try {
    // Get the URL parameters
    const params = new URLSearchParams(window.location.search);
    const role = params.get('role');
    const name = decodeURIComponent(params.get('name'));
    const address = decodeURIComponent(params.get('address'));
    const password = decodeURIComponent(params.get('password'));

    // Wait for the session to be established
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // If no session, try to get the user from the URL hash
    if (!session) {
      const { data: { user }, error: hashError } = await supabase.auth.getUser();
      if (hashError) throw hashError;
      if (!user) throw new Error('No user found after magic link verification');
      
      // Use the email from the URL parameters if available
      const email = params.get('email') || user.email;
      if (!email) throw new Error('No email found for user');

      // Complete the registration by inserting into the appropriate table
      const result = await completeRegistration(email, role, name, address, password);

      if (result.status === 'success') {
        // Set a success message in localStorage
        localStorage.setItem('registrationSuccess', 'true');
        // Redirect to the appropriate dashboard
        window.location.href = `/pages/${role.toLowerCase()}dashboard`;
      } else {
        throw new Error(result.message);
      }
    } else {
      // If we have a session, proceed with the email from the session
      const email = session.user.email;
      if (!email) throw new Error('No user email found in session');

      // Complete the registration by inserting into the appropriate table
      const result = await completeRegistration(email, role, name, address, password);

      if (result.status === 'success') {
        // Set a success message in localStorage
        localStorage.setItem('registrationSuccess', 'true');
        // Redirect to the appropriate dashboard
        window.location.href = `/pages/${role.toLowerCase()}dashboard`;
      } else {
        throw new Error(result.message);
      }
    }
  } catch (error) {
    console.error('Auth callback error:', error);
    // Store error in localStorage instead of redirecting
    localStorage.setItem('registrationError', error.message);
    // Redirect to the appropriate dashboard or home page
    window.location.href = '/';
  }
};