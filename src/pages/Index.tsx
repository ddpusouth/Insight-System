import React, { useState } from 'react';
import { API_BASE_URL } from '@/config';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { useToast } from "@/components/ui/use-toast";
import {
  Users,
  FileText,
  Calendar,
  Phone,
  Building2,
  GraduationCap,
  User,
  ChevronLeft,
  ChevronRight,
  Mail,
  MapPin,
  Clock
} from 'lucide-react';
import frontImage from '@/assets/front.jpg';
import departementImage from '@/assets/board.jpg';
import officeImage1 from '@/assets/office1.jpg';
import officeImage from '@/assets/office2.jpg';
import officeImage3 from '@/assets/office3.jpg'


const Index: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [contactSuccess, setContactSuccess] = useState('');
  const [contactError, setContactError] = useState('');

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setContactForm({ ...contactForm, [e.target.name]: e.target.value });
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/api/contactus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      });

      if (!res.ok) throw new Error('Failed to send message');

      toast({
        title: "Success",
        description: "Message sent successfully!",
        className: "bg-green-600 text-white",
        duration: 3000,
      });

      setContactForm({ name: '', email: '', subject: '', message: '' });
    } catch (err: any) {
      toast({
        title: "Failed",
        description: err.message || "Failed to send message",
        className: "bg-red-600 text-white",
        duration: 3000,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col items-center">
            <div className="flex flex-wrap justify-center gap-6 w-full">
              <img
                src={frontImage}
                alt="BNM Institute of Technology Front View"
                className="rounded-lg shadow-lg object-cover h-64 w-64"
              />
              <img
                src={departementImage}
                alt="Department Office"
                className="rounded-lg shadow-lg object-cover h-64 w-64"
              />
              <img
                src={officeImage}
                alt="College Office"
                className="rounded-lg shadow-lg object-cover h-64 w-64"
              />
              <img
                src={officeImage3}
                alt="College Office"
                className="rounded-lg shadow-lg object-cover h-64 w-64"
              />
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="py-12 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-4">About the system</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The All-in-One Platform for communication, queries, and collaboration is designed to support educational boards and a large network of colleges. It centralizes communication, simplifies query handling, and fosters collaboration across institutions, ensuring smooth coordination between administrators.</p>
          </div>
          <div className="text-center">
            <Button
              onClick={() => navigate('/login')}
              size="lg"
              className="px-8 py-3 text-lg"
            >
              Login
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-4">Contact Us</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get in touch with us for any queries, suggestions, or support. We're here to help you.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Information */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-foreground mb-4">Get In Touch</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Address</p>
                    <p className="text-muted-foreground">1, Krishna Rajendra Rd, New Tharagupet, Bengaluru, Karnataka 560002</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-muted-foreground">+91-95915 93550</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-muted-foreground">bspucpa25@gmail.com</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Office Hours</p>
                    <p className="text-muted-foreground">Monday - Friday: 10:00 AM - 5:00 PM</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">Send us a Message</h3>
                <form className="space-y-4" onSubmit={handleContactSubmit}>
                  <div>
                    <label className="block text-sm font-medium mb-1">College Username</label>
                    <input
                      type="text"
                      name="name"
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                      placeholder="Username"
                      value={contactForm.name}
                      onChange={handleContactChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Subject/Title</label>
                    <input
                      type="text"
                      name="subject"
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                      placeholder="Subject of your message"
                      value={contactForm.subject}
                      onChange={handleContactChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Message</label>
                    <textarea
                      rows={4}
                      name="message"
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                      placeholder="Your message here..."
                      value={contactForm.message}
                      onChange={handleContactChange}
                      required
                    ></textarea>
                  </div>

                  <Button type="submit" className="w-full">
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-primary text-primary-foreground text-center py-6">
        © 2025 INSIGHT SYSTEM. @ <a href="https://datalegions.netlify.app/" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-200">DataLegions</a>, BNM Institute of Technology, All rights reserved.
      </footer>
    </div>
  );
};

export default Index;
