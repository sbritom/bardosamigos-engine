import {
    Tv,
    Radio,
    Trophy,
    MessageCircle,
} from "lucide-react";

import Button from "../../../shared/buttons/Button";
import Container from "../../../shared/layout/Container";

const items = [

    {
        icon:Tv,
        title:"TV AO VIVO",
        subtitle:"Assista agora"
    },

    {
        icon:Radio,
        title:"RÁDIO ONLINE",
        subtitle:"Ouça agora"
    },

    {
        icon:Trophy,
        title:"FUTEBOL AO VIVO",
        subtitle:"Jogos e resultados"
    },

    {
        icon:MessageCircle,
        title:"CHAT DA GALERA",
        subtitle:"Converse agora"
    }

]

export default function Hero(){

return(

<section className="py-4">

<Container>

<div className="rounded-[20px] overflow-hidden border border-[#2a2a2a] bg-gradient-to-r from-[#090909] via-[#1b1406] to-[#090909]">

<div className="grid lg:grid-cols-[1.4fr_.8fr]">

<div className="p-10">

<div className="text-[#D4AF37] font-black mb-4">

🍺 BAR DOS AMIGOS

</div>

<h1 className="text-6xl font-black leading-tight">

Aqui a <span className="text-[#D4AF37]">

diversão

</span>

<br/>

nunca para!

</h1>

<p className="mt-5 max-w-xl text-zinc-400">

Rádio, TV, Futebol, Notícias,

Ferramentas,

Games

e Comunidade.

</p>

<div className="mt-7 flex gap-3">

<Button>

📺 Assistir TV

</Button>

<Button variant="ghost">

💬 Entrar no Chat

</Button>

</div>

</div>

<div className="grid grid-cols-2">

{

items.map((item)=>{

const Icon=item.icon;

return(

<div

key={item.title}

className="border-l border-[#282828] border-b border-[#282828] flex flex-col justify-center items-center h-[120px] hover:bg-black/20 transition"

>

<Icon

size={38}

className="text-[#D4AF37] mb-3"

/>

<div className="font-black">

{item.title}

</div>

<div className="text-sm text-zinc-400">

{item.subtitle}

</div>

</div>

)

})

}

</div>

</div>

</div>

</Container>

</section>

)

}