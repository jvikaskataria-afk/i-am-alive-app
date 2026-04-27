import { useState, useEffect } from "react";
import { AlertTriangle, Trash2, Settings, Edit2, Save, X } from "lucide-react";

const CHECK_IN_KEY = "iamalive_last_checkin";
const CONTACTS_KEY = "iamalive_contacts";
const USER_DETAILS_KEY = "iamalive_user_details";

interface Contact {
  id: string;
  name: string;
  phone: string;
}

interface UserDetails {
  name: string;
  phone: string;
  email: string;
}

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Swipe down to dismiss state
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);

  const [isSafe, setIsSafe] = useState(false);
  const [lastCheckIn, setLastCheckIn] = useState<number | null>(null);
  const [isWarning, setIsWarning] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [rippleKey, setRippleKey] = useState<number>(0);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [editingContactId, setEditingContactId] = useState<string | null>(null);

  const [userDetails, setUserDetails] = useState<UserDetails>({ name: "", phone: "", email: "" });

  useEffect(() => {
    const storedTime = localStorage.getItem(CHECK_IN_KEY);
    if (storedTime) {
      const timestamp = parseInt(storedTime, 10);
      setLastCheckIn(timestamp);
      
      const checkInDate = new Date(timestamp);
      const now = new Date();
      
      const isToday = 
        checkInDate.getFullYear() === now.getFullYear() &&
        checkInDate.getMonth() === now.getMonth() &&
        checkInDate.getDate() === now.getDate();
        
      setIsSafe(isToday);

      const hoursPassed = (now.getTime() - timestamp) / (1000 * 60 * 60);
      if (hoursPassed >= 24) {
        setIsWarning(true);
      }
    }

    const storedContacts = localStorage.getItem(CONTACTS_KEY);
    if (storedContacts) {
      try {
        setContacts(JSON.parse(storedContacts));
      } catch (e) {
        // ignore
      }
    }

    const storedUser = localStorage.getItem(USER_DETAILS_KEY);
    if (storedUser) {
      try {
        setUserDetails(JSON.parse(storedUser));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    if (isWarning) {
      console.warn("CRITICAL: User has not checked in for 24 hours. Preparing to notify emergency contacts...");
    }
  }, [isWarning, lastCheckIn]);

  const handleCheckIn = () => {
    const now = Date.now();
    localStorage.setItem(CHECK_IN_KEY, now.toString());
    setLastCheckIn(now);
    setIsSafe(true);
    setIsWarning(false);
  };

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(new Date(timestamp));
  };

  // User Details logic
  const handleUserDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newDetails = { ...userDetails, [name]: value };
    setUserDetails(newDetails);
    localStorage.setItem(USER_DETAILS_KEY, JSON.stringify(newDetails));
  };

  // Contacts logic
  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    let updatedContacts;
    if (editingContactId) {
      updatedContacts = contacts.map(c => 
        c.id === editingContactId ? { ...c, name: newName.trim(), phone: newPhone.trim() } : c
      );
      setEditingContactId(null);
    } else {
      const newContact: Contact = {
        id: Date.now().toString(),
        name: newName.trim(),
        phone: newPhone.trim(),
      };
      updatedContacts = [...contacts, newContact];
    }
    
    setContacts(updatedContacts);
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(updatedContacts));
    setNewName("");
    setNewPhone("");
  };

  const startEditingContact = (contact: Contact) => {
    setEditingContactId(contact.id);
    setNewName(contact.name);
    setNewPhone(contact.phone);
  };

  const cancelEditingContact = () => {
    setEditingContactId(null);
    setNewName("");
    setNewPhone("");
  };

  const deleteContact = (id: string) => {
    const updatedContacts = contacts.filter((c) => c.id !== id);
    setContacts(updatedContacts);
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(updatedContacts));
    if (editingContactId === id) {
      cancelEditingContact();
    }
  };

  // Drag logic for Settings drawer
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setStartY(e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const diff = e.clientY - startY;
    if (diff > 0) {
      setDragY(diff);
    }
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragY > 120) {
      setIsSettingsOpen(false);
    }
    setDragY(0);
  };

  return (
    <div style={{
      display: "flex", 
      flexDirection: "column", 
      width: "100%",
      minHeight: "100%",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Main View */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        opacity: isSettingsOpen && !isDragging ? 0.3 : 1,
        transform: isSettingsOpen && !isDragging ? "scale(0.95)" : "scale(1)",
        transition: "all 0.3s cubic-bezier(0.32, 0.72, 0, 1)"
      }}>
        {/* Native App Header */}
        <header style={{
          padding: "2rem 1.5rem 1rem",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          width: "100%",
          position: "relative",
          zIndex: 10
        }}>
          <div style={{ width: "40px" }} /> {/* Spacer to center logo */}
          
          <img 
            src="/logo.png" 
            alt="I AM ALIVE" 
            className="logo-pulse"
            style={{
              width: "120px",
              height: "auto",
              objectFit: "contain",
              maxWidth: "60vw"
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />

          <button 
            onClick={() => setIsSettingsOpen(true)}
            style={{ 
              background: "transparent", border: "none", color: "var(--color-text-secondary)", 
              padding: "0.5rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" 
            }}
            aria-label="Settings"
          >
            <Settings size={24} />
          </button>
        </header>

        {/* Main Content (Button Area) */}
        <main style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem 1.5rem",
          minHeight: "60vh"
        }}>
          {isWarning && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              color: "var(--color-red-500, #ef4444)",
              padding: "1rem 1.25rem",
              borderRadius: "1rem",
              marginBottom: "2.5rem",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              width: "100%",
              maxWidth: "340px",
              boxShadow: "0 0 24px rgba(239, 68, 68, 0.2), inset 0 0 12px rgba(239, 68, 68, 0.1)"
            }}>
              <AlertTriangle size={24} style={{ flexShrink: 0, filter: "drop-shadow(0 0 8px rgba(239,68,68,0.5))" }} />
              <span style={{ fontWeight: 500, fontSize: "0.95rem", lineHeight: 1.4 }}>
                You haven’t checked in today. Tap the button to confirm you're safe.
              </span>
            </div>
          )}

          {/* Physical Button Base */}
          <div style={{
            width: "320px",
            height: "320px",
            borderRadius: "50%",
            background: "linear-gradient(145deg, #1e293b, #0f172a)",
            boxShadow: "20px 20px 60px rgba(0,0,0,0.5), -10px -10px 30px rgba(255,255,255,0.02), inset 0 4px 10px rgba(255,255,255,0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            marginBottom: "1rem"
          }}>
            {/* Ambient Breathing Background Glow */}
            <div 
              className="ambient-glow"
              style={{
                position: "absolute",
                top: "-100px",
                left: "-100px",
                right: "-100px",
                bottom: "-100px",
                borderRadius: "50%",
                background: isSafe 
                  ? "radial-gradient(circle, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0) 70%)" 
                  : "radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0) 70%)",
                zIndex: -1,
                transition: "background 1s ease"
              }} 
            />

            {/* 3D Button */}
            <button
              onPointerDown={() => { setIsPressed(true); setRippleKey(Date.now()); }}
              onPointerUp={() => setIsPressed(false)}
              onPointerLeave={() => setIsPressed(false)}
              onClick={handleCheckIn}
              style={{
                width: "250px",
                height: "250px",
                borderRadius: "50%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                background: isSafe 
                  ? "radial-gradient(circle at 30% 30%, #4ade80, #16a34a)" 
                  : "radial-gradient(circle at 30% 30%, #f87171, #dc2626)",
                color: "white",
                border: "none",
                boxShadow: isSafe
                  ? (isPressed 
                      ? "0 0px 0 #14532d, 0 0px 15px rgba(34, 197, 94, 0.4), inset 0 15px 30px rgba(0,0,0,0.6), inset 0 4px 8px rgba(0,0,0,0.5)"
                      : "0 16px 0 #14532d, 0 25px 40px rgba(34, 197, 94, 0.6), inset 0 8px 20px rgba(255,255,255,0.5), inset 0 -8px 20px rgba(0,0,0,0.2)")
                  : (isPressed
                      ? "0 0px 0 #7f1d1d, 0 0px 15px rgba(239, 68, 68, 0.4), inset 0 15px 30px rgba(0,0,0,0.6), inset 0 4px 8px rgba(0,0,0,0.5)"
                      : "0 16px 0 #7f1d1d, 0 25px 40px rgba(239, 68, 68, 0.6), inset 0 8px 20px rgba(255,255,255,0.5), inset 0 -8px 20px rgba(0,0,0,0.2)"),
                cursor: "pointer",
                transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
                transform: isPressed ? "translateY(8px)" : "translateY(-8px)",
                WebkitTapHighlightColor: "transparent",
                outline: "none",
                position: "relative",
                overflow: "hidden",
                filter: isPressed ? "brightness(0.85)" : "brightness(1)"
              }}
            >
              {/* Ripple Effect */}
              {rippleKey > 0 && <div key={rippleKey} className="ripple" />}

              {/* Glossy Highlight */}
              <div style={{
                position: "absolute",
                top: "2%",
                left: "15%",
                width: "70%",
                height: "40%",
                background: "linear-gradient(to bottom, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 100%)",
                borderRadius: "50%",
                pointerEvents: "none",
                transition: "opacity 0.15s ease",
                opacity: isPressed ? 0.2 : 1
              }} />

              {/* Checked-in State */}
              <div style={{ 
                position: "absolute", 
                zIndex: 1, 
                display: "flex", 
                flexDirection: "column", 
                alignItems: "center",
                opacity: isSafe ? 1 : 0,
                transform: isSafe ? "scale(1)" : "scale(0.9)",
                transition: "all 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
                pointerEvents: isSafe ? "auto" : "none"
              }}>
                <span style={{ 
                  fontSize: "2.4rem", 
                  fontWeight: 800, 
                  lineHeight: 0.85, 
                  color: "rgba(255, 255, 255, 0.85)",
                  textShadow: "0 -1px 1px rgba(255,255,255,0.5), 0 1px 3px rgba(0,0,0,0.6)", 
                  textAlign: "center" 
                }}>
                  CHECK-IN<br />COMPLETE
                </span>
              </div>

              {/* Default State */}
              <div style={{ 
                position: "absolute", 
                zIndex: 1, 
                display: "flex", 
                flexDirection: "column", 
                alignItems: "center",
                opacity: !isSafe ? 1 : 0,
                transform: !isSafe ? "scale(1)" : "scale(0.9)",
                transition: "all 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
                pointerEvents: !isSafe ? "auto" : "none"
              }}>
                <span style={{ 
                  fontSize: "3.5rem", 
                  fontWeight: 800, 
                  lineHeight: 0.85, 
                  letterSpacing: "1px",
                  color: "rgba(255, 255, 255, 0.85)",
                  textShadow: "0 -1px 1px rgba(255,255,255,0.5), 0 1px 3px rgba(0,0,0,0.6)", 
                  textAlign: "center" 
                }}>
                  I AM<br />ALIVE
                </span>
              </div>
            </button>
          </div>

          {lastCheckIn && (
            <div style={{ marginTop: "2.5rem", textAlign: "center" }}>
              <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--color-text-secondary)", marginBottom: "0.25rem", fontWeight: 600 }}>
                Last Check-in
              </div>
              <div style={{ fontSize: "1.125rem", fontWeight: 500, color: "var(--color-text-primary)" }}>
                {formatDate(lastCheckIn)}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Settings Drawer Overlay */}
      {/* Background Dimmer */}
      <div 
        style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          opacity: isSettingsOpen ? 1 : 0,
          pointerEvents: isSettingsOpen ? "auto" : "none",
          transition: "opacity 0.3s ease",
          zIndex: 40
        }}
        onClick={() => setIsSettingsOpen(false)}
      />

      {/* Settings Drawer */}
      <div 
        style={{
          position: "fixed",
          top: "5dvh",
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "var(--color-bg-primary)",
          borderTopLeftRadius: "1.5rem",
          borderTopRightRadius: "1.5rem",
          zIndex: 50,
          boxShadow: "0 -10px 40px rgba(0,0,0,0.5)",
          transform: isSettingsOpen 
            ? `translateY(${isDragging ? Math.max(0, dragY) : 0}px)` 
            : "translateY(100%)",
          transition: isDragging ? "none" : "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
          display: "flex",
          flexDirection: "column"
        }}
      >
        {/* Drag Handle & Header */}
        <div 
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          style={{
            padding: "1rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
            touchAction: "none",
            cursor: "grab"
          }}
        >
          <div style={{
            width: "40px", height: "4px", backgroundColor: "rgba(255,255,255,0.2)",
            borderRadius: "2px", marginBottom: "1rem"
          }} />
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <div style={{ width: "40px" }} /> {/* Spacer */}
            <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "700", color: "var(--color-text-primary)" }}>
              Settings
            </h1>
            <button 
              onClick={() => setIsSettingsOpen(false)}
              style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", color: "var(--color-text-primary)", padding: "0.5rem", display: "flex", cursor: "pointer" }}
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Settings Content */}
        <main style={{ padding: "1.5rem", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* Personal Details Section */}
          <section>
            <h2 style={{ fontSize: "1.125rem", fontWeight: "700", marginBottom: "1rem", color: "var(--color-text-primary)" }}>
              Personal Details
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <input
                type="text"
                name="name"
                placeholder="Your Full Name"
                value={userDetails.name}
                onChange={handleUserDetailsChange}
                style={{
                  padding: "0.875rem 1rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.1)",
                  backgroundColor: "rgba(30, 41, 59, 0.5)", color: "white", fontSize: "1rem"
                }}
              />
              <input
                type="tel"
                name="phone"
                placeholder="Your Phone Number"
                value={userDetails.phone}
                onChange={handleUserDetailsChange}
                style={{
                  padding: "0.875rem 1rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.1)",
                  backgroundColor: "rgba(30, 41, 59, 0.5)", color: "white", fontSize: "1rem"
                }}
              />
              <input
                type="email"
                name="email"
                placeholder="Your Email Address"
                value={userDetails.email}
                onChange={handleUserDetailsChange}
                style={{
                  padding: "0.875rem 1rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.1)",
                  backgroundColor: "rgba(30, 41, 59, 0.5)", color: "white", fontSize: "1rem"
                }}
              />
            </div>
          </section>

          {/* Emergency Contacts Section */}
          <section>
            <h2 style={{ fontSize: "1.125rem", fontWeight: "700", marginBottom: "1rem", color: "var(--color-text-primary)" }}>
              Emergency Contacts
            </h2>

            <form onSubmit={handleSaveContact} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2rem" }}>
              <input
                type="text"
                placeholder="Contact Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                style={{
                  padding: "0.875rem 1rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.1)",
                  backgroundColor: "rgba(30, 41, 59, 0.5)", color: "white", fontSize: "1rem"
                }}
                required
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                style={{
                  padding: "0.875rem 1rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.1)",
                  backgroundColor: "rgba(30, 41, 59, 0.5)", color: "white", fontSize: "1rem"
                }}
                required
              />
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                <button
                  type="submit"
                  style={{
                    flex: 1, padding: "0.875rem", borderRadius: "0.75rem", backgroundColor: "var(--color-text-primary)",
                    color: "var(--color-bg-primary)", fontWeight: "700", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem"
                  }}
                >
                  <Save size={20} />
                  {editingContactId ? "Update Contact" : "Add Contact"}
                </button>
                {editingContactId && (
                  <button
                    type="button"
                    onClick={cancelEditingContact}
                    style={{
                      padding: "0.875rem", borderRadius: "0.75rem", backgroundColor: "transparent", border: "1px solid rgba(255,255,255,0.2)",
                      color: "white", fontWeight: "700", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center"
                    }}
                    aria-label="Cancel edit"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            </form>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {contacts.length === 0 ? (
                <p style={{ color: "var(--color-text-secondary)", textAlign: "center", fontStyle: "italic", fontSize: "0.875rem", padding: "1rem 0" }}>
                  No contacts added yet.
                </p>
              ) : (
                contacts.map((contact) => (
                  <div key={contact.id} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem",
                    backgroundColor: "rgba(30, 41, 59, 0.3)", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.05)",
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: "600", fontSize: "1rem", color: "var(--color-text-primary)" }}>{contact.name}</div>
                      <div style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem", marginTop: "0.125rem" }}>{contact.phone}</div>
                    </div>
                    <div style={{ display: "flex", gap: "0.25rem" }}>
                      <button
                        onClick={() => startEditingContact(contact)}
                        style={{ background: "none", border: "none", color: "var(--color-text-secondary)", padding: "0.5rem", cursor: "pointer" }}
                        aria-label="Edit contact"
                      >
                        <Edit2 size={20} />
                      </button>
                      <button
                        onClick={() => deleteContact(contact.id)}
                        style={{ background: "none", border: "none", color: "var(--color-red-500)", padding: "0.5rem", cursor: "pointer" }}
                        aria-label="Delete contact"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;