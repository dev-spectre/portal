import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { backendUrl, STATUS_CODES } from "@/lib/constants";
import { fetchClassList, formatDate } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Checkbox } from "./ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

const postSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  documentSource: z.string().url().optional(),
  classId: z.array(z.number()).min(1, "At least one class must be selected"),
});

type PostFormData = z.infer<typeof postSchema>;

export default function CreatePostForm() {
  const userId = useRef<number>(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [selectedClasses, setSelectedClasses] = useState<number[]>([]);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: { classId: [] },
  });

  const [classList, setClassList] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    const classListCache = JSON.parse(localStorage.getItem("classList") ?? "[]");
    setClassList(classListCache);
    fetchClassList(setClassList);

    userId.current = parseInt(localStorage.getItem("userId") ?? "");
    if (!userId.current) {
      localStorage.clear();
      window.location.href = "/signin";
    }
  }, [userId]);

  const handleClassSelection = (id: number) => {
    setSelectedClasses((prev) => {
      const updated = prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id];
      setValue("classId", updated);
      return updated;
    });
  };

  const onSubmit = async (data: PostFormData) => {
    try {
      const response = await axios.post(
        `${backendUrl}/post/`,
        {
          ...data,
          authorId: Number(userId.current),
        },
        {
          withCredentials: true,
          validateStatus: () => true,
        }
      );

      if (response.status === STATUS_CODES.CREATED) {
        setSuccess("Post created successfully");
      } else {
        setError("Failed to create post");
      }
    } catch {
      setError("An error occurred");
    }
  };

  return (
    <Card className="border bg-black text-white border-white/30 rounded-lg px-4 py-7 w-full">
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input placeholder="Title" {...register("title")} className="border border-white/30" />
          {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
          <Input placeholder="Description (optional)" {...register("description")} className="border border-white/30" />
          <Input placeholder="Document Source (optional)" {...register("documentSource")} className="border border-white/30" />

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full bg-black border hover:bg-white/10 hover:text-white border-white/30">
                {selectedClasses.length > 0
                  ? classList
                      .filter((c) => selectedClasses.includes(c.id))
                      .map((c) => c.name)
                      .join(", ")
                  : "Select Classes"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-2 text-white bg-black border-white/30">
              {classList.map((cls) => (
                <div key={cls.id} className="flex items-center space-x-2">
                  <Checkbox id={cls.id.toString()} checked={selectedClasses.includes(cls.id)} onCheckedChange={() => handleClassSelection(cls.id)} />
                  <label className="flex-grow" htmlFor={cls.id.toString()}>
                    {cls.name}
                  </label>
                </div>
              ))}
            </PopoverContent>
          </Popover>
          {errors.classId && <p className="text-red-500 text-sm">{errors.classId.message}</p>}
          {success && <p className="text-green-500 text-sm">{success}</p>}
          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Button type="submit" className="w-full">
            Create Post
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

interface Post {
  id: number;
  title: string;
  description: string | null;
  documentSource: string | null;
  createdAt: string;
  updatedAt: string;
  PostAccess: {
    class: {
      name: string;
      id: number;
    };
  }[];
}

export function PostList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", documentSource: "" as string | null, classIds: [] as number[] });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [classes, setClasses] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    fetchPosts();
    fetchClassList(setClasses);
  }, []);

  const fetchPosts = async () => {
    const postCache = JSON.parse(localStorage.getItem("post") ?? "[]");
    setPosts(postCache);

    try {
      const response = await axios.get(`${backendUrl}/post/`, {
        params: { limit: 10, offset: 0 },
        withCredentials: true,
        validateStatus: () => true,
      });
      if (response.status === STATUS_CODES.OK) {
        setPosts(response.data.post);
        localStorage.setItem("post", JSON.stringify(response.data.post));
      }
    } catch {
      console.error("Failed to fetch posts");
    }
  };

  const deletePost = async (postId: number) => {
    try {
      const response = await axios.delete(`${backendUrl}/post/${postId}`, {
        withCredentials: true,
        validateStatus: () => true,
      });
      if (response.status === STATUS_CODES.OK) {
        setPosts(posts.filter((post) => post.id !== postId));
      }
    } catch {
      console.error("Failed to delete post");
    }
  };

  const handleEditClick = (post: Post) => {
    setEditingPost(post);
    setEditForm({
      title: post.title,
      description: post.description || "",
      documentSource: post.documentSource || "",
      classIds: post.PostAccess.map((access) => access.class.id),
    });
    setDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    try {
      editForm.documentSource = editForm.documentSource || null;
      const response = await axios.put(
        `${backendUrl}/post/`,
        {
          postId: editingPost?.id,
          ...editForm,
          classId: editForm.classIds,
        },
        {
          withCredentials: true,
          validateStatus: () => true,
        }
      );
      if (response.status === STATUS_CODES.OK) {
        setDialogOpen(false);
        fetchPosts();
      }
    } catch {
      console.error("Failed to update post");
    }
  };

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Card key={post.id} className="border bg-black text-white border-white/30 rounded-lg p-4">
          <CardContent>
            <div className="flex flex-wrap justify-between mb-3">
              <h3 className="text-xl font-bold">{post.title}</h3>
              <p className="text-sm text-gray-400">
                Uploaded: {formatDate(new Date(post.createdAt))} {post.createdAt !== post.updatedAt && "(Edited)"}
              </p>
            </div>
            {post.description && <p className="text-gray-300 mb-2">{post.description}</p>}
            {post.documentSource && (
              <a href={post.documentSource} target="_blank" rel="noopener noreferrer" className="text-blue-400">
                View Document
              </a>
            )}

            <p className="mt-3">Classes: {post.PostAccess.map((cls) => cls.class.name).join(", ")}</p>

            <div className="flex gap-2 mt-7">
              <Button onClick={() => deletePost(post.id)}>Delete</Button>
              <Button onClick={() => handleEditClick(post)}>Edit</Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {editingPost && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-black text-white">
            <DialogHeader>
              <DialogTitle>Edit Post</DialogTitle>
            </DialogHeader>
            <Input placeholder="Title" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
            <Input placeholder="Description" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
            <Input placeholder="Document Source" value={editForm.documentSource ?? ""} onChange={(e) => setEditForm({ ...editForm, documentSource: e.target.value })} />
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="bg-black text-white  hover:bg-white/10 hover:text-white">
                  {editForm.classIds.length > 0
                    ? classes
                        .filter((c) => editForm.classIds.includes(c.id))
                        .map((c) => c.name)
                        .join(", ")
                    : "Select Classes"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="bg-black text-white">
                {classes.map((cls) => (
                  <div key={cls.id} className="flex items-center gap-2">
                    <Checkbox
                      id={cls.id.toString()}
                      checked={editForm.classIds.includes(cls.id)}
                      onCheckedChange={(checked) => {
                        setEditForm((prev) => ({
                          ...prev,
                          classIds: checked ? [...prev.classIds, cls.id] : prev.classIds.filter((id) => id !== cls.id),
                        }));
                      }}
                    />
                    <label className="flex-grow" htmlFor={cls.id.toString()}>
                      {cls.name}
                    </label>
                  </div>
                ))}
              </PopoverContent>
            </Popover>
            <Button onClick={handleEditSubmit}>Save Changes</Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
