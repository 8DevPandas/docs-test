import { ChatInterface } from "@/components/chat/chat-interface";
import { getRequiredProject } from "@/lib/project-context";

export default async function NewChatPage() {
  const project = await getRequiredProject();
  return <ChatInterface chatId={null} initialMessages={[]} projectName={project.name} logoUrl={project.logoUrl} />;
}
