'use client';

export function GoogleMaps() {
  return (
    <div className="w-full h-64 rounded-xl overflow-hidden">
      <iframe
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d120936.5196376813!2d-70.03777694999999!3d18.735700000000003!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8eaf8838ddd9d2a5%3A0x4b1cf3fe0752a06!2sDominican%20Republic!5e0!3m2!1sen!2sus!4v1699999999999!5m2!1sen!2sus"
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Alternative 3D Studio Location"
      />
    </div>
  );
}
