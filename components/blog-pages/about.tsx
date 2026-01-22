export const About = ({ about }: { about?: string }) => (
  <div
    className="w-full flex flex-col p-16 justify-center text-white container mx-auto
    rounded-md items-center gap-1 text-center bg-linear-to-r from-blue-500 to-purple-500 shadow-lg"
  >
    <h1 className="text-xl md:text-2xl font-semibold">
      Latest news, tips, and travel posts {about ? `about ${about}` : "from all users"}
    </h1>
    <p className="text-sx">Here, you will always find latest news, photos, projects and travel posts.</p>
    <p className="text-sx">
      Здесь вы всегда найдёте последние новости, фото, проекты и путешествия. А также, возможно, стоит подумать о
      мультиязычности.
    </p>
  </div>
);
