import { ChatInterface } from "@/components/chat/chat-interface";
import { getProject } from "@/lib/project-context";

export default async function NewChatPage() {
  const project = await getProject();
  return <ChatInterface chatId={null} initialMessages={[]} projectName={project.name} logoUrl={project.logoUrl} />;
}
